import { getAiAction } from '@openlms/ai/actions';
import {
  type AiPolicyRule,
  type Assignment,
  AssignmentTrendCardId,
  AssignmentTrendCardResult,
  type AssignmentTrendCardResult as AssignmentTrendCardResultContract,
  type AuditLog,
  type Consent,
  type ContextPackage,
  type InstitutionConsentPolicy,
  type OutboxEvent,
  type Rubric,
  StoredAssignmentTrendCard,
  type StoredAssignmentTrendCard as StoredAssignmentTrendCardContract,
  type Submission,
} from '@openlms/contracts';
import { ulid } from 'ulid';
import {
  type AiGenerationResult,
  buildAiGenerationAuditMetadata,
} from '../ai-logs/generation-result.ts';
import {
  buildAiPolicyAuditMetadata,
  canUseSubjectContextForAiAction,
  evaluateAiPolicy,
  hasInvalidCohortCounts,
} from '../ai-policy/evaluator.ts';
import { buildContextPackage } from '../context/broker.ts';
import { buildAuditLog, buildOutboxEvent } from '../events/audit-outbox.ts';
import { runWithIdempotencyKeyLock } from './idempotency.ts';

export type AssignmentTrendCardRequest = {
  tenantId: string;
  actorId: string;
  assignmentId: string;
  idempotencyKey: string;
  cohortSizeTotal: number;
  cohortSizeConsenting: number;
  now: Date;
};

export type AssignmentTrendCardRequestPorts = {
  getAssignmentById: (tenantId: string, assignmentId: string) => Promise<Assignment | null>;
  getRubricById: (tenantId: string, rubricId: string) => Promise<Rubric | null>;
  listSubmissionsByAssignment: (tenantId: string, assignmentId: string) => Promise<Submission[]>;
  getTrendPolicyRule: (tenantId: string) => Promise<AiPolicyRule>;
  getInstitutionConsentPolicy: (tenantId: string) => Promise<InstitutionConsentPolicy>;
  listConsentsForSubjects: (tenantId: string, subjectIds: string[]) => Promise<Consent[]>;
  findExistingTrendCard: (
    tenantId: string,
    assignmentId: string,
    idempotencyKey: string,
  ) => Promise<StoredAssignmentTrendCardContract | null>;
  saveContextPackage: (contextPackage: ContextPackage) => Promise<void>;
  generateTrendCard: (
    contextPackage: ContextPackage,
  ) => Promise<AiGenerationResult<AssignmentTrendCardResultContract>>;
  saveTrendCard: (
    trendCard: StoredAssignmentTrendCardContract,
  ) => Promise<StoredAssignmentTrendCardContract>;
  saveAuditLog: (auditLog: AuditLog) => Promise<void>;
  saveOutboxEvent: (event: OutboxEvent) => Promise<void>;
};

export type AssignmentTrendCardRequestResult = {
  trendCard: StoredAssignmentTrendCardContract;
  contextPackage: ContextPackage | null;
  created: boolean;
};

const readAssignment = async (
  request: AssignmentTrendCardRequest,
  ports: AssignmentTrendCardRequestPorts,
): Promise<Assignment> => {
  const assignment = await ports.getAssignmentById(request.tenantId, request.assignmentId);

  if (!assignment) {
    throw new Error('Assignment was not found. Refresh the assignment and retry.');
  }

  if (!assignment.activeRubricId) {
    throw new Error('Assignment trend cards require an active rubric on the assignment.');
  }

  return assignment;
};

const readRubric = async (
  request: AssignmentTrendCardRequest,
  ports: AssignmentTrendCardRequestPorts,
  assignment: Assignment,
): Promise<Rubric> => {
  if (!assignment.activeRubricId) {
    throw new Error('Assignment trend cards require an active rubric on the assignment.');
  }

  const rubric = await ports.getRubricById(request.tenantId, assignment.activeRubricId);

  if (!rubric) {
    throw new Error('Rubric was not found. Attach a rubric and retry.');
  }

  return rubric;
};

export const requestAssignmentTrendCard = async (
  request: AssignmentTrendCardRequest,
  ports: AssignmentTrendCardRequestPorts,
): Promise<AssignmentTrendCardRequestResult> => {
  const assignment = await readAssignment(request, ports);
  const rubric = await readRubric(request, ports, assignment);
  return runWithIdempotencyKeyLock(
    `assignment_trend_card:${request.tenantId}:${assignment.id}:${request.idempotencyKey}`,
    async () => {
      const existing = await ports.findExistingTrendCard(
        request.tenantId,
        assignment.id,
        request.idempotencyKey,
      );

      if (existing) {
        return {
          trendCard: existing,
          contextPackage: null,
          created: false,
        };
      }

      const submissions = await ports.listSubmissionsByAssignment(request.tenantId, assignment.id);
      const action = getAiAction('assignment_trend_card');

      if (hasInvalidCohortCounts(request.cohortSizeTotal, request.cohortSizeConsenting)) {
        throw new Error('Cohort counts are invalid. Verify total and consenting learner counts.');
      }

      const [rule, consentPolicy, consents] = await Promise.all([
        ports.getTrendPolicyRule(request.tenantId),
        ports.getInstitutionConsentPolicy(request.tenantId),
        ports.listConsentsForSubjects(
          request.tenantId,
          submissions.map((submission) => submission.studentId),
        ),
      ]);

      const consentEligibleSubmissions = submissions.filter((submission) =>
        canUseSubjectContextForAiAction({
          action,
          rule,
          consentPolicy,
          consents: consents.filter((consent) => consent.subjectId === submission.studentId),
          now: request.now,
        }),
      );
      const cohortSizeTotal = submissions.length;
      const cohortSizeConsenting = consentEligibleSubmissions.length;

      if (cohortSizeConsenting < consentPolicy.minNForDisclosure) {
        throw new Error('Assignment trend card suppressed below disclosure threshold.');
      }

      const policyDecision = evaluateAiPolicy({
        action,
        rule,
        consentPolicy,
        consents,
        cohortSizeTotal,
        cohortSizeConsenting,
      });

      if (!policyDecision.allowed) {
        throw new Error(`Assignment trend card denied by policy: ${policyDecision.reason}`);
      }

      await ports.saveAuditLog(
        buildAuditLog(
          {
            tenantId: request.tenantId,
            actorId: request.actorId,
            category: 'ai_request',
            action: 'request_assignment_trend_card',
            resourceType: 'assignment',
            resourceId: assignment.id,
            metadata: {
              actionIdentifier: action.identifier,
              ...buildAiPolicyAuditMetadata(policyDecision),
            },
          },
          request.now,
        ),
      );

      const contextPackage = buildContextPackage(
        {
          tenantId: request.tenantId,
          actorId: request.actorId,
          actionIdentifier: action.identifier,
          policyDecision,
          resources: [
            {
              resourceType: 'assignment',
              resourceId: assignment.id,
              title: assignment.title,
              body: assignment.instructions,
              metadata: {
                cohortSizeTotal,
                cohortSizeConsenting,
              },
            },
            {
              resourceType: 'rubric',
              resourceId: rubric.id,
              title: rubric.title,
              body: JSON.stringify(rubric.criteria),
              metadata: { version: rubric.version },
            },
            {
              resourceType: 'aggregate',
              resourceId: `${assignment.id}:submissions`,
              title: 'Submission aggregate',
              body: JSON.stringify(
                consentEligibleSubmissions.map((submission) => ({
                  id: submission.id,
                  version: submission.version,
                  status: submission.status,
                  text: submission.contentSnapshot.map((block) => block.text).join('\n\n'),
                })),
              ),
              metadata: { submissionCount: consentEligibleSubmissions.length },
            },
          ],
        },
        request.now,
      );
      await ports.saveContextPackage(contextPackage);

      const generation = await ports.generateTrendCard(contextPackage);
      const result = AssignmentTrendCardResult.parse({
        ...generation.output,
        cohortSizeTotal,
        cohortSizeConsenting,
        signalQualityClass: policyDecision.signalQualityClass,
      });
      const trendCard = await ports.saveTrendCard(
        StoredAssignmentTrendCard.parse({
          id: AssignmentTrendCardId.parse(ulid()),
          tenantId: request.tenantId,
          assignmentId: assignment.id,
          contextPackageId: contextPackage.id,
          idempotencyKey: request.idempotencyKey,
          result,
          createdAt: request.now,
        }),
      );

      await ports.saveAuditLog(
        buildAuditLog(
          {
            tenantId: request.tenantId,
            actorId: null,
            category: 'ai_generation',
            action: 'generate_assignment_trend_card',
            resourceType: 'assignment_trend_card',
            resourceId: trendCard.id,
            metadata: {
              assignmentId: assignment.id,
              contextPackageId: contextPackage.id,
              ...buildAiPolicyAuditMetadata(policyDecision),
              ...buildAiGenerationAuditMetadata(generation.metadata),
            },
          },
          request.now,
        ),
      );
      await ports.saveOutboxEvent(
        buildOutboxEvent(
          {
            tenantId: request.tenantId,
            topic: 'assignment.feedback',
            eventType: 'ai.assignment_trend_card.generated',
            payload: {
              assignmentId: assignment.id,
              assignmentTrendCardId: trendCard.id,
            },
          },
          request.now,
        ),
      );

      return {
        trendCard,
        contextPackage,
        created: true,
      };
    },
  );
};
