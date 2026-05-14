import { getAiAction } from '@openlms/ai/actions';
import {
  type AiPolicyRule,
  type AuditLog,
  type Consent,
  type ContextPackage,
  type InstitutionConsentPolicy,
  type OutboxEvent,
  type Rubric,
  RubricClarityReviewId,
  type RubricClarityReviewResult,
  StoredRubricClarityReview,
  type StoredRubricClarityReview as StoredRubricClarityReviewContract,
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

export type RubricClarityReviewRequest = {
  tenantId: string;
  actorId: string;
  rubricId: string;
  idempotencyKey: string;
  now: Date;
};

export type RubricClarityReviewRequestPorts = {
  getRubricById: (tenantId: string, rubricId: string) => Promise<Rubric | null>;
  getRubricClarityPolicyRule: (tenantId: string) => Promise<AiPolicyRule>;
  getInstitutionConsentPolicy: (tenantId: string) => Promise<InstitutionConsentPolicy>;
  listConsentsForSubject: (tenantId: string, subjectId: string) => Promise<Consent[]>;
  findExistingRubricClarityReview: (
    tenantId: string,
    rubricId: string,
    idempotencyKey: string,
  ) => Promise<StoredRubricClarityReviewContract | null>;
  saveContextPackage: (contextPackage: ContextPackage) => Promise<void>;
  generateRubricClarityReview: (
    contextPackage: ContextPackage,
  ) => Promise<AiGenerationResult<RubricClarityReviewResult>>;
  saveRubricClarityReview: (
    review: StoredRubricClarityReviewContract,
  ) => Promise<StoredRubricClarityReviewContract>;
  saveAuditLog: (auditLog: AuditLog) => Promise<void>;
  saveOutboxEvent: (event: OutboxEvent) => Promise<void>;
};

export type RubricClarityReviewRequestResult = {
  review: StoredRubricClarityReviewContract;
  contextPackage: ContextPackage | null;
  created: boolean;
};

export const requestRubricClarityReview = async (
  request: RubricClarityReviewRequest,
  ports: RubricClarityReviewRequestPorts,
): Promise<RubricClarityReviewRequestResult> => {
  const rubric = await ports.getRubricById(request.tenantId, request.rubricId);

  if (!rubric) {
    throw new Error('Rubric was not found. Refresh the rubric and retry.');
  }

  return runWithIdempotencyKeyLock(
    `rubric_clarity_review:${request.tenantId}:${rubric.id}:${request.idempotencyKey}`,
    async () => {
      const existing = await ports.findExistingRubricClarityReview(
        request.tenantId,
        rubric.id,
        request.idempotencyKey,
      );

      if (existing) {
        return {
          review: existing,
          contextPackage: null,
          created: false,
        };
      }

      const action = getAiAction('rubric_clarity_review');
      const [rule, consentPolicy, consents] = await Promise.all([
        ports.getRubricClarityPolicyRule(request.tenantId),
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
        throw new Error(`Rubric clarity review denied by policy: ${policyDecision.reason}`);
      }

      await ports.saveAuditLog(
        buildAuditLog(
          {
            tenantId: request.tenantId,
            actorId: request.actorId,
            category: 'ai_request',
            action: 'request_rubric_clarity_review',
            resourceType: 'rubric',
            resourceId: rubric.id,
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
              resourceType: 'rubric',
              resourceId: rubric.id,
              title: rubric.title,
              body: JSON.stringify(rubric.criteria),
              metadata: { version: rubric.version },
            },
          ],
        },
        request.now,
      );
      await ports.saveContextPackage(contextPackage);

      const generation = await ports.generateRubricClarityReview(contextPackage);
      const review = await ports.saveRubricClarityReview(
        StoredRubricClarityReview.parse({
          id: RubricClarityReviewId.parse(ulid()),
          tenantId: request.tenantId,
          rubricId: rubric.id,
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
            action: 'generate_rubric_clarity_review',
            resourceType: 'rubric_clarity_review',
            resourceId: review.id,
            metadata: {
              rubricId: rubric.id,
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
            eventType: 'ai.rubric_clarity_review.generated',
            payload: {
              rubricId: rubric.id,
              rubricClarityReviewId: review.id,
            },
          },
          request.now,
        ),
      );

      return {
        review,
        contextPackage,
        created: true,
      };
    },
  );
};
