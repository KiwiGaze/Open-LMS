import { getAiAction } from '@openlms/ai/actions';
import {
  type AiPolicyRule,
  type AuditLog,
  type Consent,
  type ContextPackage,
  type CoursePage,
  type InstitutionConsentPolicy,
  type LearningObjective,
  type OutboxEvent,
  PageExplanationId,
  type PageExplanationResult,
  StoredPageExplanation,
  type StoredPageExplanation as StoredPageExplanationContract,
} from '@openlms/contracts';
import { ulid } from 'ulid';
import {
  type AiGenerationResult,
  buildAiGenerationAuditMetadata,
} from '../ai-logs/generation-result.ts';
import { buildAiPolicyAuditMetadata, evaluateAiPolicy } from '../ai-policy/evaluator.ts';
import { runWithIdempotencyKeyLock } from '../assignment-feedback/idempotency.ts';
import { buildContextPackage } from '../context/broker.ts';
import { buildAuditLog, buildOutboxEvent } from '../events/audit-outbox.ts';

export type PageExplanationRequest = {
  tenantId: string;
  actorId: string;
  coursePageId: string;
  idempotencyKey: string;
  now: Date;
};

export type PageExplanationRequestPorts = {
  getCoursePageById: (tenantId: string, coursePageId: string) => Promise<CoursePage | null>;
  listLearningObjectivesByIds: (
    tenantId: string,
    courseId: string,
    learningObjectiveIds: string[],
  ) => Promise<LearningObjective[]>;
  getPageExplanationPolicyRule: (tenantId: string) => Promise<AiPolicyRule>;
  getInstitutionConsentPolicy: (tenantId: string) => Promise<InstitutionConsentPolicy>;
  listConsentsForSubject: (tenantId: string, subjectId: string) => Promise<Consent[]>;
  findExistingPageExplanation: (
    tenantId: string,
    coursePageId: string,
    idempotencyKey: string,
  ) => Promise<StoredPageExplanationContract | null>;
  saveContextPackage: (contextPackage: ContextPackage) => Promise<void>;
  generatePageExplanation: (
    contextPackage: ContextPackage,
  ) => Promise<AiGenerationResult<PageExplanationResult>>;
  savePageExplanation: (
    pageExplanation: StoredPageExplanationContract,
  ) => Promise<StoredPageExplanationContract>;
  saveAuditLog: (auditLog: AuditLog) => Promise<void>;
  saveOutboxEvent: (event: OutboxEvent) => Promise<void>;
};

export type PageExplanationRequestResult = {
  pageExplanation: StoredPageExplanationContract;
  contextPackage: ContextPackage | null;
  created: boolean;
};

const readPublishedPage = async (
  request: PageExplanationRequest,
  ports: PageExplanationRequestPorts,
): Promise<CoursePage> => {
  const page = await ports.getCoursePageById(request.tenantId, request.coursePageId);

  if (!page) {
    throw new Error('Course page was not found. Refresh the page and retry.');
  }

  if (page.visibility !== 'published') {
    throw new Error('Page explanations are only available for published course pages.');
  }

  return page;
};

const buildObjectiveMetadata = (
  learningObjectiveIds: string[],
  learningObjectives: LearningObjective[],
): Array<{
  id: string;
  code: string;
  title: string;
  description: string | null;
  masteryThresholdPercent: number | null;
}> => {
  const objectivesById = new Map<string, LearningObjective>(
    learningObjectives.map((objective) => [objective.id, objective] as const),
  );

  return learningObjectiveIds.flatMap((objectiveId) => {
    const objective = objectivesById.get(objectiveId);

    if (!objective) {
      return [];
    }

    return [
      {
        id: objective.id,
        code: objective.code,
        title: objective.title,
        description: objective.description,
        masteryThresholdPercent: objective.masteryThresholdPercent,
      },
    ];
  });
};

export const requestPageExplanation = async (
  request: PageExplanationRequest,
  ports: PageExplanationRequestPorts,
): Promise<PageExplanationRequestResult> => {
  const page = await readPublishedPage(request, ports);
  return runWithIdempotencyKeyLock(
    `page_explanation:${request.tenantId}:${page.id}:${request.idempotencyKey}`,
    async () => {
      const existing = await ports.findExistingPageExplanation(
        request.tenantId,
        page.id,
        request.idempotencyKey,
      );

      if (existing) {
        return {
          pageExplanation: existing,
          contextPackage: null,
          created: false,
        };
      }

      const action = getAiAction('page_explanation');
      const [rule, consentPolicy, consents] = await Promise.all([
        ports.getPageExplanationPolicyRule(request.tenantId),
        ports.getInstitutionConsentPolicy(request.tenantId),
        ports.listConsentsForSubject(request.tenantId, request.actorId),
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
        throw new Error(`Page explanation denied by policy: ${policyDecision.reason}`);
      }

      await ports.saveAuditLog(
        buildAuditLog(
          {
            tenantId: request.tenantId,
            actorId: request.actorId,
            category: 'ai_request',
            action: 'request_page_explanation',
            resourceType: 'course_page',
            resourceId: page.id,
            metadata: {
              actionIdentifier: action.identifier,
              ...buildAiPolicyAuditMetadata(policyDecision),
            },
          },
          request.now,
        ),
      );

      const learningObjectives =
        page.learningObjectiveIds.length === 0
          ? []
          : await ports.listLearningObjectivesByIds(
              request.tenantId,
              page.courseId,
              page.learningObjectiveIds,
            );

      const contextPackage = buildContextPackage(
        {
          tenantId: request.tenantId,
          actorId: request.actorId,
          actionIdentifier: action.identifier,
          policyDecision,
          resources: [
            {
              resourceType: 'course_page',
              resourceId: page.id,
              title: page.title,
              body: page.body,
              metadata: {
                courseId: page.courseId,
                version: page.version,
                learningObjectiveIds: page.learningObjectiveIds,
                learningObjectives: buildObjectiveMetadata(
                  page.learningObjectiveIds,
                  learningObjectives,
                ),
              },
            },
          ],
        },
        request.now,
      );
      await ports.saveContextPackage(contextPackage);

      const generation = await ports.generatePageExplanation(contextPackage);
      const pageExplanation = await ports.savePageExplanation(
        StoredPageExplanation.parse({
          id: PageExplanationId.parse(ulid()),
          tenantId: request.tenantId,
          coursePageId: page.id,
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
            action: 'generate_page_explanation',
            resourceType: 'page_explanation',
            resourceId: pageExplanation.id,
            metadata: {
              coursePageId: page.id,
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
            topic: 'course.content',
            eventType: 'ai.page_explanation.generated',
            payload: {
              coursePageId: page.id,
              pageExplanationId: pageExplanation.id,
            },
          },
          request.now,
        ),
      );

      return {
        pageExplanation,
        contextPackage,
        created: true,
      };
    },
  );
};
