import {
  AiPolicyRule,
  Assignment,
  type AuditLog,
  type ContextPackage,
  InstitutionConsentPolicy,
  Rubric,
  StoredSubmissionPrecheck,
  type StoredSubmissionPrecheck as StoredSubmissionPrecheckContract,
  Submission,
  SubmissionPrecheckResult,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  type SubmissionPrecheckRequestPorts,
  requestSubmissionPrecheck,
} from '../src/assignment-feedback/precheck-service.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = actorId;

const assignment = Assignment.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  title: 'Evidence essay',
  instructions: 'Write an essay using textual evidence.',
  status: 'published',
  dueAt: null,
  allowResubmission: true,
  activeRubricId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
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
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  tenantId,
  assignmentId: assignment.id,
  studentId,
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE30',
  version: 1,
  status: 'submitted',
  contentSnapshot: [{ blockId: 'intro', text: 'The quote is present but unexplained.' }],
  submittedAt: now,
  createdAt: now,
});

const output = SubmissionPrecheckResult.parse({
  summary: 'Explain the evidence more clearly.',
  issues: [
    {
      criterionId: 'criterion-evidence',
      severity: 'medium',
      message: 'Evidence is quoted without explanation.',
      evidence: ['The quote is present but unexplained.'],
      suggestion: 'Add one sentence explaining how the quote supports the claim.',
    },
  ],
});

const generationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE33',
  promptIdentifier: 'submission_precheck.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'precheck-model',
};

const createPorts = () => {
  const contexts: ContextPackage[] = [];
  const saved: StoredSubmissionPrecheckContract[] = [];
  const audits: AuditLog[] = [];
  const events: string[] = [];

  const ports = {
    getSubmissionById: async () => submission,
    getAssignmentById: async () => assignment,
    getRubricById: async () => rubric,
    getPrecheckPolicyRule: async () =>
      AiPolicyRule.parse({
        tenantId,
        actionIdentifier: 'submission_precheck',
        version: 1,
        enabled: true,
        riskLevel: 'medium',
        scope: 'single',
        requiresHumanReview: false,
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
    findExistingPrecheck: async () => null,
    saveContextPackage: async (contextPackage) => {
      contexts.push(contextPackage);
    },
    generatePrecheck: async () => ({
      output,
      metadata: generationMetadata,
    }),
    savePrecheck: async (precheck) => {
      saved.push(precheck);
      return precheck;
    },
    saveAuditLog: async (auditLog) => {
      audits.push(auditLog);
    },
    saveOutboxEvent: async (event) => {
      events.push(event.eventType);
    },
  } satisfies SubmissionPrecheckRequestPorts;

  return { ports, contexts, saved, audits, events };
};

describe('submission precheck orchestration', () => {
  it('generates and stores a policy-gated precheck result', async () => {
    const { ports, contexts, saved, audits, events } = createPorts();

    const result = await requestSubmissionPrecheck(
      {
        tenantId,
        actorId,
        submissionId: submission.id,
        idempotencyKey: 'precheck-job-1',
        now,
      },
      ports,
    );

    expect(result.created).toBe(true);
    expect(result.precheck.result.summary).toContain('Explain');
    expect(contexts).toHaveLength(1);
    expect(saved).toHaveLength(1);
    expect(audits.map((audit) => audit.action)).toEqual([
      'request_submission_precheck',
      'generate_submission_precheck',
    ]);
    expect(audits[0]?.metadata).toEqual(
      expect.objectContaining({
        actionIdentifier: 'submission_precheck',
        policyVersion: 1,
        policyAllowed: true,
        policyRequiresHumanReview: false,
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
    expect(events).toEqual(['ai.submission_precheck.generated']);
  });

  it('returns an existing precheck result for duplicate idempotency keys', async () => {
    const baseline = createPorts();
    const existing = StoredSubmissionPrecheck.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId,
      submissionId: submission.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      idempotencyKey: 'precheck-job-1',
      result: output,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      findExistingPrecheck: async () => existing,
    } satisfies SubmissionPrecheckRequestPorts;

    const result = await requestSubmissionPrecheck(
      {
        tenantId,
        actorId,
        submissionId: submission.id,
        idempotencyKey: 'precheck-job-1',
        now,
      },
      ports,
    );

    expect(result.created).toBe(false);
    expect(baseline.saved).toHaveLength(0);
  });

  it('validates the submitting actor before replaying an existing precheck idempotency key', async () => {
    const baseline = createPorts();
    const existing = StoredSubmissionPrecheck.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId,
      submissionId: submission.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      idempotencyKey: 'precheck-job-1',
      result: output,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      getSubmissionById: async () =>
        Submission.parse({
          ...submission,
          studentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
        }),
      findExistingPrecheck: async () => existing,
    } satisfies SubmissionPrecheckRequestPorts;

    await expect(
      requestSubmissionPrecheck(
        {
          tenantId,
          actorId,
          submissionId: submission.id,
          idempotencyKey: 'precheck-job-1',
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/submitting student/i);
  });
});
