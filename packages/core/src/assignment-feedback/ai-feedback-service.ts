import { getAiAction } from '@openlms/ai/actions';
import type {
  AiFeedbackDraft,
  AiPolicyRule,
  Assignment,
  AuditLog,
  Consent,
  ContextPackage,
  FeedbackDraftResult,
  InstitutionConsentPolicy,
  OutboxEvent,
  Rubric,
  Submission,
} from '@openlms/contracts';
import {
  type AiGenerationResult,
  buildAiGenerationAuditMetadata,
} from '../ai-logs/generation-result.ts';
import { buildAiPolicyAuditMetadata, evaluateAiPolicy } from '../ai-policy/evaluator.ts';
import { buildContextPackage } from '../context/broker.ts';
import { buildAuditLog, buildOutboxEvent } from '../events/audit-outbox.ts';
import { runWithIdempotencyKeyLock } from './idempotency.ts';
import { recordAiFeedbackDraft } from './workflow.ts';

export type AiFeedbackDraftRequest = {
  tenantId: string;
  actorId: string;
  submissionId: string;
  idempotencyKey?: string;
  now: Date;
};

export type AiFeedbackDraftRequestPorts = {
  getSubmissionById: (tenantId: string, submissionId: string) => Promise<Submission | null>;
  getAssignmentById: (tenantId: string, assignmentId: string) => Promise<Assignment | null>;
  getRubricById: (tenantId: string, rubricId: string) => Promise<Rubric | null>;
  getFeedbackDraftPolicyRule: (tenantId: string) => Promise<AiPolicyRule>;
  getInstitutionConsentPolicy: (tenantId: string) => Promise<InstitutionConsentPolicy>;
  listConsentsForSubject: (tenantId: string, subjectId: string) => Promise<Consent[]>;
  findExistingAiFeedbackDraft: (
    tenantId: string,
    submissionId: string,
    idempotencyKey: string,
  ) => Promise<AiFeedbackDraft | null>;
  saveContextPackage: (contextPackage: ContextPackage) => Promise<void>;
  generateFeedbackDraft: (
    contextPackage: ContextPackage,
  ) => Promise<AiGenerationResult<FeedbackDraftResult>>;
  saveAiFeedbackDraft: (feedbackDraft: AiFeedbackDraft) => Promise<AiFeedbackDraft>;
  saveAuditLog: (auditLog: AuditLog) => Promise<void>;
  saveOutboxEvent: (event: OutboxEvent) => Promise<void>;
};

export type AiFeedbackDraftRequestResult =
  | {
      feedbackDraft: AiFeedbackDraft;
      contextPackage: ContextPackage;
      policyDecision: ReturnType<typeof evaluateAiPolicy>;
      created: true;
    }
  | {
      feedbackDraft: AiFeedbackDraft;
      contextPackage: null;
      policyDecision: null;
      created: false;
    };

const readSubmission = async (
  request: AiFeedbackDraftRequest,
  ports: AiFeedbackDraftRequestPorts,
): Promise<Submission> => {
  const submission = await ports.getSubmissionById(request.tenantId, request.submissionId);

  if (!submission) {
    throw new Error('Submission was not found. Refresh the submission and retry.');
  }

  return submission;
};

const readAssignment = async (
  request: AiFeedbackDraftRequest,
  ports: AiFeedbackDraftRequestPorts,
  submission: Submission,
): Promise<Assignment> => {
  const assignment = await ports.getAssignmentById(request.tenantId, submission.assignmentId);

  if (!assignment) {
    throw new Error('Assignment was not found. Refresh the submission and retry.');
  }

  if (!assignment.aiSettings.feedbackDraftEnabled) {
    throw new Error('AI feedback drafts are disabled for this assignment.');
  }

  if (!assignment.activeRubricId) {
    throw new Error('AI feedback drafts require an active rubric on the assignment.');
  }

  return assignment;
};

const readRubric = async (
  request: AiFeedbackDraftRequest,
  ports: AiFeedbackDraftRequestPorts,
  assignment: Assignment,
): Promise<Rubric> => {
  if (!assignment.activeRubricId) {
    throw new Error('AI feedback drafts require an active rubric on the assignment.');
  }

  const rubric = await ports.getRubricById(request.tenantId, assignment.activeRubricId);

  if (!rubric) {
    throw new Error('Rubric was not found. Attach a rubric and retry.');
  }

  return rubric;
};

export const requestAiFeedbackDraft = async (
  request: AiFeedbackDraftRequest,
  ports: AiFeedbackDraftRequestPorts,
): Promise<AiFeedbackDraftRequestResult> => {
  const submission = await readSubmission(request, ports);
  const assignment = await readAssignment(request, ports, submission);
  const rubric = await readRubric(request, ports, assignment);

  const runRequest = async (): Promise<AiFeedbackDraftRequestResult> => {
    if (request.idempotencyKey) {
      const existing = await ports.findExistingAiFeedbackDraft(
        request.tenantId,
        submission.id,
        request.idempotencyKey,
      );

      if (existing) {
        return {
          feedbackDraft: existing,
          contextPackage: null,
          policyDecision: null,
          created: false,
        };
      }
    }

    const action = getAiAction('feedback_draft');
    const [rule, consentPolicy, consents] = await Promise.all([
      ports.getFeedbackDraftPolicyRule(request.tenantId),
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
      throw new Error(`AI feedback draft denied by policy: ${policyDecision.reason}`);
    }

    await ports.saveAuditLog(
      buildAuditLog(
        {
          tenantId: request.tenantId,
          actorId: request.actorId,
          category: 'ai_request',
          action: 'request_feedback_draft',
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

    const generation = await ports.generateFeedbackDraft(contextPackage);
    const feedbackDraft = await ports.saveAiFeedbackDraft(
      recordAiFeedbackDraft({
        submission,
        contextPackageId: contextPackage.id,
        generationMetadata: generation.metadata,
        idempotencyKey:
          request.idempotencyKey ?? `feedback_draft:${submission.id}:${contextPackage.id}`,
        output: generation.output,
        now: request.now,
      }),
    );

    await ports.saveAuditLog(
      buildAuditLog(
        {
          tenantId: request.tenantId,
          actorId: null,
          category: 'ai_generation',
          action: 'generate_feedback_draft',
          resourceType: 'ai_feedback_draft',
          resourceId: feedbackDraft.id,
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
          eventType: 'ai.feedback_draft.generated',
          payload: {
            submissionId: submission.id,
            aiFeedbackDraftId: feedbackDraft.id,
          },
        },
        request.now,
      ),
    );

    return {
      feedbackDraft,
      contextPackage,
      policyDecision,
      created: true,
    };
  };

  return request.idempotencyKey
    ? runWithIdempotencyKeyLock(
        `feedback_draft:${request.tenantId}:${submission.id}:${request.idempotencyKey}`,
        runRequest,
      )
    : runRequest();
};
