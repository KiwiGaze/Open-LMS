import { getAiAction } from '@openlms/ai/actions';
import { AiAction, AiPolicyRule, Consent, InstitutionConsentPolicy } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { canUseSubjectContextForAiAction, evaluateAiPolicy } from '../src/ai-policy/evaluator.ts';
import { buildOutboxEvent } from '../src/events/audit-outbox.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const action = AiAction.parse({
  identifier: 'feedback_draft',
  productSurface: 'teacher_feedback_studio',
  requiredContext: ['assignment', 'rubric', 'submission'],
  optionalContext: [],
  outputContract: 'FeedbackDraftResult',
  riskLevel: 'medium',
  humanReviewRequired: true,
  allowedAudience: ['instructor', 'system'],
  scope: 'single',
});

const rule = AiPolicyRule.parse({
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  actionIdentifier: 'feedback_draft',
  version: 3,
  enabled: true,
  riskLevel: 'medium',
  scope: 'single',
  requiresHumanReview: true,
  requiresExplicitConsent: true,
  minCohortSizeForDisclosure: 5,
});

const consentPolicy = InstitutionConsentPolicy.parse({
  tenantId: rule.tenantId,
  defaultPosture: 'explicit_only',
  jurisdictionProfile: 'us_college',
  ageGateEnabled: false,
  reconsentTriggers: ['provider_change'],
  minNForDisclosure: 5,
  createdAt: now,
  updatedAt: now,
});

const consent = Consent.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  tenantId: rule.tenantId,
  subjectId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  actionType: 'ai_analysis',
  scope: 'tenant',
  scopeId: rule.tenantId,
  state: 'granted',
  grantedBy: 'subject',
  grantedAt: now,
  revokedAt: null,
  expiresAt: null,
  evidence: null,
  createdAt: now,
  updatedAt: now,
});

describe('AI policy evaluator', () => {
  it('allows an enabled action when required consent is granted', () => {
    const decision = evaluateAiPolicy(
      {
        action,
        rule,
        consentPolicy,
        consents: [consent],
        cohortSizeTotal: null,
        cohortSizeConsenting: null,
      },
      now,
    );

    expect(decision.allowed).toBe(true);
    expect(decision.requiresHumanReview).toBe(true);
    expect(decision.policyVersion).toBe(3);
  });

  it('blocks actions missing explicit consent', () => {
    const decision = evaluateAiPolicy(
      {
        action,
        rule,
        consentPolicy,
        consents: [],
        cohortSizeTotal: null,
        cohortSizeConsenting: null,
      },
      now,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/consent/i);
  });

  it('blocks explicit consent when the granted consent is for a different action type', () => {
    const decision = evaluateAiPolicy(
      {
        action,
        rule,
        consentPolicy,
        consents: [
          Consent.parse({
            ...consent,
            actionType: 'automated_profiling',
          }),
        ],
        cohortSizeTotal: null,
        cohortSizeConsenting: null,
      },
      now,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/consent/i);
  });

  it('treats a later matching revocation as overriding a stale grant', () => {
    const revokedConsent = Consent.parse({
      ...consent,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3A',
      state: 'revoked',
      revokedAt: new Date('2026-05-10T00:01:00.000Z'),
      createdAt: new Date('2026-05-10T00:01:00.000Z'),
      updatedAt: new Date('2026-05-10T00:01:00.000Z'),
    });
    const consents = [consent, revokedConsent];

    const decision = evaluateAiPolicy(
      {
        action,
        rule,
        consentPolicy,
        consents,
        cohortSizeTotal: null,
        cohortSizeConsenting: null,
      },
      now,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/consent/i);
    expect(
      canUseSubjectContextForAiAction({
        action,
        rule,
        consentPolicy,
        consents,
        now,
      }),
    ).toBe(false);
  });

  it('suppresses cohort signals below disclosure threshold', () => {
    const cohortAction = AiAction.parse({
      ...action,
      identifier: 'cohort_live_review',
      scope: 'cohort',
    });
    const cohortRule = AiPolicyRule.parse({
      ...rule,
      actionIdentifier: 'cohort_live_review',
      scope: 'cohort',
      requiresExplicitConsent: false,
    });

    const decision = evaluateAiPolicy(
      {
        action: cohortAction,
        rule: cohortRule,
        consentPolicy: {
          ...consentPolicy,
          defaultPosture: 'opt_out',
        },
        consents: [],
        cohortSizeTotal: 42,
        cohortSizeConsenting: 4,
      },
      now,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.signalQualityClass).toBe('insufficient_n');
  });

  it('suppresses batch aggregate signals below disclosure threshold', () => {
    const batchAction = AiAction.parse({
      ...action,
      identifier: 'assignment_trend_card',
      scope: 'batch',
    });
    const batchRule = AiPolicyRule.parse({
      ...rule,
      actionIdentifier: 'assignment_trend_card',
      scope: 'batch',
      requiresExplicitConsent: false,
    });

    const decision = evaluateAiPolicy(
      {
        action: batchAction,
        rule: batchRule,
        consentPolicy: {
          ...consentPolicy,
          defaultPosture: 'opt_out',
        },
        consents: [],
        cohortSizeTotal: 42,
        cohortSizeConsenting: 4,
      },
      now,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.signalQualityClass).toBe('insufficient_n');
  });

  it('blocks aggregate signals with impossible cohort counts', () => {
    const batchAction = AiAction.parse({
      ...action,
      identifier: 'assignment_trend_card',
      scope: 'batch',
    });
    const batchRule = AiPolicyRule.parse({
      ...rule,
      actionIdentifier: 'assignment_trend_card',
      scope: 'batch',
      requiresExplicitConsent: false,
    });

    const decision = evaluateAiPolicy(
      {
        action: batchAction,
        rule: batchRule,
        consentPolicy: {
          ...consentPolicy,
          defaultPosture: 'opt_out',
        },
        consents: [],
        cohortSizeTotal: 10,
        cohortSizeConsenting: 12,
      },
      now,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/cohort counts/i);
  });

  it('evaluates declared cohort actions and emits a realtime-safe policy event', () => {
    const cohortAction = getAiAction('cohort_live_review');
    const cohortRule = AiPolicyRule.parse({
      ...rule,
      actionIdentifier: cohortAction.identifier,
      scope: cohortAction.scope,
      requiresExplicitConsent: false,
      requiresHumanReview: true,
    });
    const decision = evaluateAiPolicy(
      {
        action: cohortAction,
        rule: cohortRule,
        consentPolicy: {
          ...consentPolicy,
          defaultPosture: 'opt_out',
        },
        consents: [],
        cohortSizeTotal: 42,
        cohortSizeConsenting: 29,
      },
      now,
    );
    const event = buildOutboxEvent(
      {
        tenantId: rule.tenantId,
        topic: 'ai.policy',
        eventType: 'ai.cohort_policy_evaluated',
        payload: {
          actionIdentifier: cohortAction.identifier,
          actionScope: cohortAction.scope,
          allowed: decision.allowed,
          signalQualityClass: decision.signalQualityClass,
          cohortSizeTotal: 42,
          cohortSizeConsenting: 29,
        },
      },
      now,
    );

    expect(decision.allowed).toBe(true);
    expect(decision.signalQualityClass).toBe('partial');
    expect(event.payload).toEqual(
      expect.objectContaining({
        actionIdentifier: 'cohort_live_review',
        actionScope: 'cohort',
        signalQualityClass: 'partial',
      }),
    );
  });
});
