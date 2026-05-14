import {
  AiPolicyRule,
  Assignment,
  AssignmentTrendCardResult,
  type AuditLog,
  Consent,
  type ContextPackage,
  InstitutionConsentPolicy,
  Rubric,
  RubricClarityReviewResult,
  StoredAssignmentTrendCard,
  type StoredAssignmentTrendCard as StoredAssignmentTrendCardContract,
  StoredRubricClarityReview,
  type StoredRubricClarityReview as StoredRubricClarityReviewContract,
  Submission,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  type AssignmentTrendCardRequestPorts,
  requestAssignmentTrendCard,
} from '../src/assignment-feedback/trend-service.ts';
import {
  type RubricClarityReviewRequestPorts,
  requestRubricClarityReview,
} from '../src/rubrics/clarity-service.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';

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

const submissions = [
  Submission.parse({
    id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
    tenantId,
    assignmentId: assignment.id,
    studentId: '01J9QW7B6N5W2YH3D3A1V0KE30',
    sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE31',
    version: 1,
    status: 'submitted',
    contentSnapshot: [{ blockId: 'intro', text: 'The quote is present but unexplained.' }],
    submittedAt: now,
    createdAt: now,
  }),
  Submission.parse({
    id: '01J9QW7B6N5W2YH3D3A1V0KE37',
    tenantId,
    assignmentId: assignment.id,
    studentId: '01J9QW7B6N5W2YH3D3A1V0KE38',
    sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE39',
    version: 1,
    status: 'submitted',
    contentSnapshot: [{ blockId: 'intro', text: 'Do not include this non-consenting text.' }],
    submittedAt: now,
    createdAt: now,
  }),
];

const trendOutput = AssignmentTrendCardResult.parse({
  title: 'Evidence needs explanation',
  summary: 'Submissions often quote evidence without explaining relevance.',
  trendType: 'criterion_weakness',
  cohortSizeTotal: 12,
  cohortSizeConsenting: 2,
  signalQualityClass: 'partial',
  evidence: ['2 of 2 consenting submissions had evidence explanation issues.'],
  suggestedTeachingAction: 'Review an example paragraph before revision.',
});

const clarityOutput = RubricClarityReviewResult.parse({
  qualityScore: 0.74,
  summary: 'The rubric is usable but can clarify evidence quality.',
  issues: [
    {
      criterionId: 'criterion-evidence',
      severity: 'medium',
      message: 'Evidence quality and evidence quantity are mixed together.',
      suggestion: 'Split relevance and source credibility into separate descriptors.',
    },
  ],
});

const trendGenerationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE34',
  promptIdentifier: 'assignment_trend_card.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'trend-model',
};

const clarityGenerationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE35',
  promptIdentifier: 'rubric_clarity_review.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'rubric-model',
};

const consentPolicy = InstitutionConsentPolicy.parse({
  tenantId,
  defaultPosture: 'opt_out',
  jurisdictionProfile: 'us_college',
  ageGateEnabled: false,
  reconsentTriggers: ['provider_change'],
  minNForDisclosure: 2,
  createdAt: now,
  updatedAt: now,
});

const actorConsent = Consent.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE36',
  tenantId,
  subjectId: actorId,
  actionType: 'ai_analysis',
  scope: 'tenant',
  scopeId: tenantId,
  state: 'granted',
  grantedBy: 'subject',
  grantedAt: now,
  revokedAt: null,
  expiresAt: null,
  evidence: 'Instructor accepted AI analysis policy.',
  createdAt: now,
  updatedAt: now,
});

const revokedCohortConsent = Consent.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3A',
  tenantId,
  subjectId: submissions[1]?.studentId ?? actorId,
  actionType: 'cohort_signal_contribution',
  scope: 'tenant',
  scopeId: tenantId,
  state: 'revoked',
  grantedBy: 'subject',
  grantedAt: now,
  revokedAt: now,
  expiresAt: null,
  evidence: 'Student opted out of cohort AI analysis.',
  createdAt: now,
  updatedAt: now,
});

const createTrendPorts = () => {
  const contexts: ContextPackage[] = [];
  const saved: StoredAssignmentTrendCardContract[] = [];
  const audits: AuditLog[] = [];
  const events: string[] = [];
  const ports = {
    getAssignmentById: async () => assignment,
    getRubricById: async () => rubric,
    listSubmissionsByAssignment: async () => submissions,
    getTrendPolicyRule: async () =>
      AiPolicyRule.parse({
        tenantId,
        actionIdentifier: 'assignment_trend_card',
        version: 1,
        enabled: true,
        riskLevel: 'medium',
        scope: 'batch',
        requiresHumanReview: true,
        requiresExplicitConsent: false,
        minCohortSizeForDisclosure: 2,
      }),
    getInstitutionConsentPolicy: async () => consentPolicy,
    listConsentsForSubjects: async () => [],
    findExistingTrendCard: async () => null,
    saveContextPackage: async (contextPackage) => {
      contexts.push(contextPackage);
    },
    generateTrendCard: async () => ({
      output: trendOutput,
      metadata: trendGenerationMetadata,
    }),
    saveTrendCard: async (trendCard) => {
      saved.push(trendCard);
      return trendCard;
    },
    saveAuditLog: async (auditLog) => {
      audits.push(auditLog);
    },
    saveOutboxEvent: async (event) => {
      events.push(event.eventType);
    },
  } satisfies AssignmentTrendCardRequestPorts;

  return { ports, contexts, saved, audits, events };
};

const createRubricPorts = () => {
  const contexts: ContextPackage[] = [];
  const saved: StoredRubricClarityReviewContract[] = [];
  const audits: AuditLog[] = [];
  const events: string[] = [];
  const ports = {
    getRubricById: async () => rubric,
    getRubricClarityPolicyRule: async () =>
      AiPolicyRule.parse({
        tenantId,
        actionIdentifier: 'rubric_clarity_review',
        version: 1,
        enabled: true,
        riskLevel: 'low',
        scope: 'batch',
        requiresHumanReview: false,
        requiresExplicitConsent: false,
        minCohortSizeForDisclosure: 5,
      }),
    getInstitutionConsentPolicy: async () => consentPolicy,
    listConsentsForSubject: async () => [],
    findExistingRubricClarityReview: async () => null,
    saveContextPackage: async (contextPackage) => {
      contexts.push(contextPackage);
    },
    generateRubricClarityReview: async () => ({
      output: clarityOutput,
      metadata: clarityGenerationMetadata,
    }),
    saveRubricClarityReview: async (review) => {
      saved.push(review);
      return review;
    },
    saveAuditLog: async (auditLog) => {
      audits.push(auditLog);
    },
    saveOutboxEvent: async (event) => {
      events.push(event.eventType);
    },
  } satisfies RubricClarityReviewRequestPorts;

  return { ports, contexts, saved, audits, events };
};

describe('trend card orchestration', () => {
  it('generates and stores an assignment trend card with audit and outbox evidence', async () => {
    const { ports, contexts, saved, audits, events } = createTrendPorts();

    const result = await requestAssignmentTrendCard(
      {
        tenantId,
        actorId,
        assignmentId: assignment.id,
        idempotencyKey: 'trend-job-1',
        cohortSizeTotal: 12,
        cohortSizeConsenting: 9,
        now,
      },
      ports,
    );

    expect(result.created).toBe(true);
    expect(result.trendCard.result.trendType).toBe('criterion_weakness');
    expect(result.trendCard.result.cohortSizeTotal).toBe(2);
    expect(result.trendCard.result.cohortSizeConsenting).toBe(2);
    expect(contexts).toHaveLength(1);
    expect(saved).toHaveLength(1);
    expect(audits.map((audit) => audit.action)).toEqual([
      'request_assignment_trend_card',
      'generate_assignment_trend_card',
    ]);
    expect(audits[0]?.metadata).toEqual(
      expect.objectContaining({
        actionIdentifier: 'assignment_trend_card',
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
        aiGenerationLogId: trendGenerationMetadata.aiGenerationLogId,
        promptIdentifier: trendGenerationMetadata.promptIdentifier,
        promptVersion: trendGenerationMetadata.promptVersion,
        providerType: trendGenerationMetadata.providerType,
        model: trendGenerationMetadata.model,
      }),
    );
    expect(events).toEqual(['ai.assignment_trend_card.generated']);
  });

  it('does not leak student identifiers into the trend-card context package', async () => {
    const { ports, contexts } = createTrendPorts();
    await requestAssignmentTrendCard(
      {
        tenantId,
        actorId,
        assignmentId: assignment.id,
        idempotencyKey: 'trend-job-anon',
        cohortSizeTotal: 12,
        cohortSizeConsenting: 9,
        now,
      },
      ports,
    );
    const contextPackage = contexts[0];
    if (!contextPackage) {
      throw new Error('Expected trend card context package to be saved.');
    }
    const studentIds = submissions.map((submission) => submission.studentId);
    for (const resource of contextPackage.resources) {
      const serialized = `${resource.title}|${resource.body}|${JSON.stringify(resource.metadata)}`;
      for (const studentId of studentIds) {
        expect(serialized.includes(studentId)).toBe(false);
      }
    }
  });

  it('returns an existing trend card for duplicate idempotency keys', async () => {
    const baseline = createTrendPorts();
    const existing = StoredAssignmentTrendCard.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      tenantId,
      assignmentId: assignment.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      idempotencyKey: 'trend-job-1',
      result: trendOutput,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      findExistingTrendCard: async () => existing,
    } satisfies AssignmentTrendCardRequestPorts;

    const result = await requestAssignmentTrendCard(
      {
        tenantId,
        actorId,
        assignmentId: assignment.id,
        idempotencyKey: 'trend-job-1',
        cohortSizeTotal: 12,
        cohortSizeConsenting: 9,
        now,
      },
      ports,
    );

    expect(result.created).toBe(false);
    expect(baseline.saved).toHaveLength(0);
  });

  it('validates the assignment before replaying an existing trend idempotency key', async () => {
    const baseline = createTrendPorts();
    const existing = StoredAssignmentTrendCard.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      tenantId,
      assignmentId: assignment.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      idempotencyKey: 'trend-job-1',
      result: trendOutput,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      getAssignmentById: async () => null,
      findExistingTrendCard: async () => existing,
    } satisfies AssignmentTrendCardRequestPorts;

    await expect(
      requestAssignmentTrendCard(
        {
          tenantId,
          actorId,
          assignmentId: assignment.id,
          idempotencyKey: 'trend-job-1',
          cohortSizeTotal: 12,
          cohortSizeConsenting: 9,
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/assignment was not found/i);
  });

  it('suppresses trend cards when consent filtering leaves too few submissions', async () => {
    const baseline = createTrendPorts();
    const ports = {
      ...baseline.ports,
      listConsentsForSubjects: async () => [revokedCohortConsent],
    } satisfies AssignmentTrendCardRequestPorts;

    await expect(
      requestAssignmentTrendCard(
        {
          tenantId,
          actorId,
          assignmentId: assignment.id,
          idempotencyKey: 'trend-job-consented-context',
          cohortSizeTotal: 12,
          cohortSizeConsenting: 9,
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/disclosure threshold/i);

    expect(baseline.contexts).toHaveLength(0);
    expect(baseline.saved).toHaveLength(0);
  });

  it('rejects assignment trend requests with impossible cohort counts before generation', async () => {
    const baseline = createTrendPorts();

    await expect(
      requestAssignmentTrendCard(
        {
          tenantId,
          actorId,
          assignmentId: assignment.id,
          idempotencyKey: 'trend-job-invalid-counts',
          cohortSizeTotal: 8,
          cohortSizeConsenting: 9,
          now,
        },
        baseline.ports,
      ),
    ).rejects.toThrow(/cohort counts/i);

    expect(baseline.contexts).toHaveLength(0);
    expect(baseline.saved).toHaveLength(0);
  });

  it('stores policy-derived aggregate counts instead of trusting model output counts', async () => {
    const baseline = createTrendPorts();
    const ports = {
      ...baseline.ports,
      generateTrendCard: async () => ({
        output: AssignmentTrendCardResult.parse({
          ...trendOutput,
          cohortSizeTotal: 99,
          cohortSizeConsenting: 99,
          signalQualityClass: 'representative',
        }),
        metadata: trendGenerationMetadata,
      }),
    } satisfies AssignmentTrendCardRequestPorts;

    const result = await requestAssignmentTrendCard(
      {
        tenantId,
        actorId,
        assignmentId: assignment.id,
        idempotencyKey: 'trend-job-server-counts',
        cohortSizeTotal: 12,
        cohortSizeConsenting: 9,
        now,
      },
      ports,
    );

    expect(result.trendCard.result).toEqual(
      expect.objectContaining({
        cohortSizeTotal: 2,
        cohortSizeConsenting: 2,
        signalQualityClass: 'representative',
      }),
    );
    expect(baseline.saved[0]?.result).toEqual(result.trendCard.result);
  });
});

describe('rubric clarity orchestration', () => {
  it('generates and stores a rubric clarity review with audit and outbox evidence', async () => {
    const { ports, contexts, saved, audits, events } = createRubricPorts();

    const result = await requestRubricClarityReview(
      {
        tenantId,
        actorId,
        rubricId: rubric.id,
        idempotencyKey: 'rubric-clarity-job-1',
        now,
      },
      ports,
    );

    expect(result.created).toBe(true);
    expect(result.review.result.qualityScore).toBe(0.74);
    expect(contexts).toHaveLength(1);
    expect(saved).toHaveLength(1);
    expect(audits.map((audit) => audit.action)).toEqual([
      'request_rubric_clarity_review',
      'generate_rubric_clarity_review',
    ]);
    expect(audits[0]?.metadata).toEqual(
      expect.objectContaining({
        actionIdentifier: 'rubric_clarity_review',
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
        aiGenerationLogId: clarityGenerationMetadata.aiGenerationLogId,
        promptIdentifier: clarityGenerationMetadata.promptIdentifier,
        promptVersion: clarityGenerationMetadata.promptVersion,
        providerType: clarityGenerationMetadata.providerType,
        model: clarityGenerationMetadata.model,
      }),
    );
    expect(events).toEqual(['ai.rubric_clarity_review.generated']);
  });

  it('returns an existing rubric clarity review for duplicate idempotency keys', async () => {
    const baseline = createRubricPorts();
    const existing = StoredRubricClarityReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      tenantId,
      rubricId: rubric.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      idempotencyKey: 'rubric-clarity-job-1',
      result: clarityOutput,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      findExistingRubricClarityReview: async () => existing,
    } satisfies RubricClarityReviewRequestPorts;

    const result = await requestRubricClarityReview(
      {
        tenantId,
        actorId,
        rubricId: rubric.id,
        idempotencyKey: 'rubric-clarity-job-1',
        now,
      },
      ports,
    );

    expect(result.created).toBe(false);
    expect(baseline.saved).toHaveLength(0);
  });

  it('validates the rubric before replaying an existing rubric clarity idempotency key', async () => {
    const baseline = createRubricPorts();
    const existing = StoredRubricClarityReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      tenantId,
      rubricId: rubric.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      idempotencyKey: 'rubric-clarity-job-1',
      result: clarityOutput,
      createdAt: now,
    });
    const ports = {
      ...baseline.ports,
      getRubricById: async () => null,
      findExistingRubricClarityReview: async () => existing,
    } satisfies RubricClarityReviewRequestPorts;

    await expect(
      requestRubricClarityReview(
        {
          tenantId,
          actorId,
          rubricId: rubric.id,
          idempotencyKey: 'rubric-clarity-job-1',
          now,
        },
        ports,
      ),
    ).rejects.toThrow(/rubric was not found/i);
  });

  it('allows rubric clarity review when explicit actor consent is granted', async () => {
    const baseline = createRubricPorts();
    const ports = {
      ...baseline.ports,
      getRubricClarityPolicyRule: async () =>
        AiPolicyRule.parse({
          tenantId,
          actionIdentifier: 'rubric_clarity_review',
          version: 2,
          enabled: true,
          riskLevel: 'low',
          scope: 'batch',
          requiresHumanReview: false,
          requiresExplicitConsent: true,
          minCohortSizeForDisclosure: 5,
        }),
      getInstitutionConsentPolicy: async () =>
        InstitutionConsentPolicy.parse({
          ...consentPolicy,
          defaultPosture: 'explicit_only',
        }),
      listConsentsForSubject: async () => [actorConsent],
    } satisfies RubricClarityReviewRequestPorts;

    const result = await requestRubricClarityReview(
      {
        tenantId,
        actorId,
        rubricId: rubric.id,
        idempotencyKey: 'rubric-clarity-explicit-consent',
        now,
      },
      ports,
    );

    expect(result.created).toBe(true);
    expect(result.review.result.summary).toBe(clarityOutput.summary);
  });
});
