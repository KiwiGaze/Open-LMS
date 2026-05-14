import {
  AiFeedbackDraft,
  AiPolicyRule,
  Assignment,
  type AuditLog,
  type ContextPackage,
  type FeedbackDraftResult,
  InstitutionConsentPolicy,
  Rubric,
  Submission,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  type AiFeedbackDraftRequestPorts,
  requestAiFeedbackDraft,
} from '../src/assignment-feedback/ai-feedback-service.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2X';

const assignment = Assignment.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  title: 'Evidence essay',
  instructions: 'Write an essay using textual evidence.',
  status: 'published',
  dueAt: null,
  allowResubmission: true,
  activeRubricId: '01J9QW7B6N5W2YH3D3A1V0KE30',
  aiSettings: {
    precheckEnabled: true,
    feedbackDraftEnabled: true,
    scoreSuggestionEnabled: false,
  },
  createdAt: now,
  updatedAt: now,
});

const rubric = Rubric.parse({
  id: assignment.activeRubricId,
  tenantId,
  title: 'Evidence rubric',
  version: 1,
  sourceTemplateId: null,
  criteria: [
    {
      id: 'criterion-evidence',
      label: 'Evidence',
      description: 'Uses evidence and explains its relevance.',
      evidenceRequired: true,
      levels: [
        { id: 'developing', label: 'Developing', description: 'Needs explanation', points: 2 },
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
});

const submission = Submission.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE31',
  tenantId,
  assignmentId: assignment.id,
  studentId,
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE32',
  version: 1,
  status: 'submitted',
  contentSnapshot: [{ blockId: 'intro', text: 'The essay includes one quotation.' }],
  submittedAt: now,
  createdAt: now,
});

const feedbackOutput: FeedbackDraftResult = {
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Explain why the quotation proves the claim.',
      teacherNote: null,
      evidence: ['The essay includes one quotation.'],
      suggestedLevelId: 'developing',
      suggestedScore: null,
    },
  ],
  overallComment: 'Focused feedback generated.',
};

const generationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE35',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'feedback-model',
};

const existingFeedbackDraft = AiFeedbackDraft.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE33',
  tenantId,
  submissionId: submission.id,
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE34',
  ...generationMetadata,
  idempotencyKey: 'feedback-draft-idempotency',
  status: 'generated',
  criterionFeedback: feedbackOutput.criterionFeedback,
  overallComment: feedbackOutput.overallComment,
  createdAt: now,
});

const createPorts = () => {
  const contexts: ContextPackage[] = [];
  const audits: AuditLog[] = [];
  const events: string[] = [];

  const ports = {
    getSubmissionById: async () => submission,
    getAssignmentById: async () => assignment,
    getRubricById: async () => rubric,
    getFeedbackDraftPolicyRule: async () =>
      AiPolicyRule.parse({
        tenantId,
        actionIdentifier: 'feedback_draft',
        version: 1,
        enabled: true,
        riskLevel: 'medium',
        scope: 'single',
        requiresHumanReview: true,
        requiresExplicitConsent: false,
        minCohortSizeForDisclosure: 5,
      }),
    getInstitutionConsentPolicy: async () =>
      InstitutionConsentPolicy.parse({
        tenantId,
        defaultPosture: 'opt_out',
        jurisdictionProfile: 'us_college',
        ageGateEnabled: false,
        reconsentTriggers: ['provider_change'],
        minNForDisclosure: 5,
        createdAt: now,
        updatedAt: now,
      }),
    listConsentsForSubject: async () => [],
    findExistingAiFeedbackDraft: async () => null,
    saveContextPackage: async (contextPackage) => {
      contexts.push(contextPackage);
    },
    generateFeedbackDraft: async (contextPackage) => {
      expect(contextPackage.resources.map((resource) => resource.resourceType)).toEqual([
        'assignment',
        'rubric',
        'submission',
      ]);
      return {
        output: feedbackOutput,
        metadata: generationMetadata,
      };
    },
    saveAiFeedbackDraft: async (feedbackDraft) => feedbackDraft,
    saveAuditLog: async (auditLog) => {
      audits.push(auditLog);
    },
    saveOutboxEvent: async (event) => {
      events.push(event.eventType);
    },
  } satisfies AiFeedbackDraftRequestPorts;

  return { ports, contexts, audits, events };
};

describe('AI feedback draft orchestration', () => {
  it('builds context, generates a draft, and records audit/outbox evidence', async () => {
    const { ports, contexts, audits, events } = createPorts();

    const result = await requestAiFeedbackDraft(
      {
        tenantId,
        actorId,
        submissionId: submission.id,
        now,
      },
      ports,
    );

    expect(result.feedbackDraft.status).toBe('generated');
    if (!result.created) {
      throw new Error('Expected feedback draft request to create a new draft.');
    }
    expect(result.policyDecision.requiresHumanReview).toBe(true);
    expect(contexts).toHaveLength(1);
    expect(audits.map((audit) => audit.action)).toEqual([
      'request_feedback_draft',
      'generate_feedback_draft',
    ]);
    expect(audits[0]?.metadata).toEqual(
      expect.objectContaining({
        actionIdentifier: 'feedback_draft',
        policyVersion: 1,
        policyAllowed: true,
        policyRequiresHumanReview: true,
      }),
    );
    expect(audits[1]?.metadata).toEqual(
      expect.objectContaining({
        contextPackageId: contexts[0]?.id,
        policyVersion: 1,
        policyAllowed: true,
        aiGenerationLogId: generationMetadata.aiGenerationLogId,
        promptIdentifier: generationMetadata.promptIdentifier,
        promptVersion: generationMetadata.promptVersion,
        providerType: generationMetadata.providerType,
        model: generationMetadata.model,
      }),
    );
    expect(events).toEqual(['ai.feedback_draft.generated']);
  });

  it('does not leak the student identifier into the AI context package resources', async () => {
    const { ports, contexts } = createPorts();
    await requestAiFeedbackDraft({ tenantId, actorId, submissionId: submission.id, now }, ports);
    expect(contexts).toHaveLength(1);
    const contextPackage = contexts[0];
    if (!contextPackage) {
      throw new Error('Expected a context package to be saved.');
    }
    for (const resource of contextPackage.resources) {
      const serialized = `${resource.title}|${resource.body}|${JSON.stringify(resource.metadata)}`;
      expect(serialized.includes(studentId)).toBe(false);
    }
  });

  it('returns an existing draft for repeated idempotency keys without regenerating', async () => {
    const baseline = createPorts();
    const ports = {
      ...baseline.ports,
      findExistingAiFeedbackDraft: async () => existingFeedbackDraft,
      generateFeedbackDraft: async () => {
        throw new Error('Generate should not run for an existing idempotency key.');
      },
    } satisfies AiFeedbackDraftRequestPorts;

    const result = await requestAiFeedbackDraft(
      {
        tenantId,
        actorId,
        submissionId: submission.id,
        idempotencyKey: existingFeedbackDraft.idempotencyKey,
        now,
      },
      ports,
    );

    expect(result).toEqual({
      feedbackDraft: existingFeedbackDraft,
      contextPackage: null,
      policyDecision: null,
      created: false,
    });
  });

  it('validates the submission before replaying an existing feedback draft idempotency key', async () => {
    const baseline = createPorts();
    const ports = {
      ...baseline.ports,
      getSubmissionById: async () => null,
      findExistingAiFeedbackDraft: async () => existingFeedbackDraft,
    } satisfies AiFeedbackDraftRequestPorts;

    await expect(
      requestAiFeedbackDraft(
        {
          tenantId,
          actorId,
          submissionId: submission.id,
          idempotencyKey: existingFeedbackDraft.idempotencyKey,
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/submission was not found/i);
  });

  it('rejects assignments with AI feedback drafts disabled', async () => {
    const baseline = createPorts();
    const ports = {
      ...baseline.ports,
      getAssignmentById: async () => ({
        ...assignment,
        aiSettings: { ...assignment.aiSettings, feedbackDraftEnabled: false },
      }),
    };

    await expect(
      requestAiFeedbackDraft(
        {
          tenantId,
          actorId,
          submissionId: submission.id,
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/disabled/);
  });
});
