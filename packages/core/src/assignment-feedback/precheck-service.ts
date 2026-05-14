import { getAiAction } from '@openlms/ai/actions';
import {
  type AiPolicyRule,
  type Assignment,
  type AuditLog,
  type Consent,
  type ContextPackage,
  type InstitutionConsentPolicy,
  type OutboxEvent,
  type Rubric,
  StoredSubmissionPrecheck,
  type StoredSubmissionPrecheck as StoredSubmissionPrecheckContract,
  type Submission,
  SubmissionPrecheckId,
  type SubmissionPrecheckResult,
} from '@openlms/contracts';
import { ulid } from 'ulid';
import {
  type AiGenerationResult,
  buildAiGenerationAuditMetadata,
} from '../ai-logs/generation-result.ts';
import { buildAiPolicyAuditMetadata, evaluateAiPolicy } from '../ai-policy/evaluator.ts';
import { buildContextPackage } from '../context/broker.ts';
import { buildAuditLog, buildOutboxEvent } from '../events/audit-outbox.ts';
import { runWithIdempotencyKeyLock } from './idempotency.ts';

export type SubmissionPrecheckRequest = {
  tenantId: string;
  actorId: string;
  submissionId: string;
  idempotencyKey: string;
  now: Date;
};

export type SubmissionPrecheckRequestPorts = {
  getSubmissionById: (tenantId: string, submissionId: string) => Promise<Submission | null>;
  getAssignmentById: (tenantId: string, assignmentId: string) => Promise<Assignment | null>;
  getRubricById: (tenantId: string, rubricId: string) => Promise<Rubric | null>;
  getPrecheckPolicyRule: (tenantId: string) => Promise<AiPolicyRule>;
  getInstitutionConsentPolicy: (tenantId: string) => Promise<InstitutionConsentPolicy>;
  listConsentsForSubject: (tenantId: string, subjectId: string) => Promise<Consent[]>;
  findExistingPrecheck: (
    tenantId: string,
    submissionId: string,
    idempotencyKey: string,
  ) => Promise<StoredSubmissionPrecheckContract | null>;
  saveContextPackage: (contextPackage: ContextPackage) => Promise<void>;
  generatePrecheck: (
    contextPackage: ContextPackage,
  ) => Promise<AiGenerationResult<SubmissionPrecheckResult>>;
  savePrecheck: (
    precheck: StoredSubmissionPrecheckContract,
  ) => Promise<StoredSubmissionPrecheckContract>;
  saveAuditLog: (auditLog: AuditLog) => Promise<void>;
  saveOutboxEvent: (event: OutboxEvent) => Promise<void>;
};

export type SubmissionPrecheckRequestResult = {
  precheck: StoredSubmissionPrecheckContract;
  contextPackage: ContextPackage | null;
  created: boolean;
};

const readSubmission = async (
  request: SubmissionPrecheckRequest,
  ports: SubmissionPrecheckRequestPorts,
): Promise<Submission> => {
  const submission = await ports.getSubmissionById(request.tenantId, request.submissionId);

  if (!submission) {
    throw new Error('Submission was not found. Refresh the submission and retry.');
  }

  if (submission.studentId !== request.actorId) {
    throw new Error('Only the submitting student can request a submission precheck.');
  }

  return submission;
};

const readAssignment = async (
  request: SubmissionPrecheckRequest,
  ports: SubmissionPrecheckRequestPorts,
  submission: Submission,
): Promise<Assignment> => {
  const assignment = await ports.getAssignmentById(request.tenantId, submission.assignmentId);

  if (!assignment) {
    throw new Error('Assignment was not found. Refresh the submission and retry.');
  }

  if (!assignment.aiSettings.precheckEnabled) {
    throw new Error('Submission precheck is disabled for this assignment.');
  }

  if (!assignment.activeRubricId) {
    throw new Error('Submission precheck requires an active rubric on the assignment.');
  }

  return assignment;
};

const readRubric = async (
  request: SubmissionPrecheckRequest,
  ports: SubmissionPrecheckRequestPorts,
  assignment: Assignment,
): Promise<Rubric> => {
  if (!assignment.activeRubricId) {
    throw new Error('Submission precheck requires an active rubric on the assignment.');
  }

  const rubric = await ports.getRubricById(request.tenantId, assignment.activeRubricId);

  if (!rubric) {
    throw new Error('Rubric was not found. Attach a rubric and retry.');
  }

  return rubric;
};

export const requestSubmissionPrecheck = async (
  request: SubmissionPrecheckRequest,
  ports: SubmissionPrecheckRequestPorts,
): Promise<SubmissionPrecheckRequestResult> => {
  const submission = await readSubmission(request, ports);
  const assignment = await readAssignment(request, ports, submission);
  const rubric = await readRubric(request, ports, assignment);
  return runWithIdempotencyKeyLock(
    `submission_precheck:${request.tenantId}:${submission.id}:${request.idempotencyKey}`,
    async () => {
      const existing = await ports.findExistingPrecheck(
        request.tenantId,
        submission.id,
        request.idempotencyKey,
      );

      if (existing) {
        return {
          precheck: existing,
          contextPackage: null,
          created: false,
        };
      }

      const action = getAiAction('submission_precheck');
      const [rule, consentPolicy, consents] = await Promise.all([
        ports.getPrecheckPolicyRule(request.tenantId),
        ports.getInstitutionConsentPolicy(request.tenantId),
        ports.listConsentsForSubject(request.tenantId, submission.studentId),
      ]);
      const policyDecision = evaluateAiPolicy({
        action,
        rule,
        consentPolicy,
        consents,
        cohortSizeTotal: null,
        cohortSizeConsenting: null,
      });

      if (!policyDecision.allowed) {
        throw new Error(`Submission precheck denied by policy: ${policyDecision.reason}`);
      }

      await ports.saveAuditLog(
        buildAuditLog(
          {
            tenantId: request.tenantId,
            actorId: request.actorId,
            category: 'ai_request',
            action: 'request_submission_precheck',
            resourceType: 'submission',
            resourceId: submission.id,
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
              metadata: { dueAt: assignment.dueAt?.toISOString() ?? null },
            },
            {
              resourceType: 'rubric',
              resourceId: rubric.id,
              title: rubric.title,
              body: JSON.stringify(rubric.criteria),
              metadata: { version: rubric.version },
            },
            {
              resourceType: 'submission',
              resourceId: submission.id,
              title: `Submission v${submission.version}`,
              body: submission.contentSnapshot.map((block) => block.text).join('\n\n'),
              metadata: { submittedAt: submission.submittedAt.toISOString() },
            },
          ],
        },
        request.now,
      );
      await ports.saveContextPackage(contextPackage);

      const generation = await ports.generatePrecheck(contextPackage);
      const precheck = await ports.savePrecheck(
        StoredSubmissionPrecheck.parse({
          id: SubmissionPrecheckId.parse(ulid()),
          tenantId: request.tenantId,
          submissionId: submission.id,
          contextPackageId: contextPackage.id,
          idempotencyKey: request.idempotencyKey,
          result: generation.output,
          createdAt: request.now,
        }),
      );

      await ports.saveAuditLog(
        buildAuditLog(
          {
            tenantId: request.tenantId,
            actorId: null,
            category: 'ai_generation',
            action: 'generate_submission_precheck',
            resourceType: 'submission_precheck',
            resourceId: precheck.id,
            metadata: {
              submissionId: submission.id,
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
            eventType: 'ai.submission_precheck.generated',
            payload: {
              submissionId: submission.id,
              submissionPrecheckId: precheck.id,
            },
          },
          request.now,
        ),
      );

      return {
        precheck,
        contextPackage,
        created: true,
      };
    },
  );
};
