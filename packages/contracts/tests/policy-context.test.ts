import { describe, expect, it } from 'vitest';
import {
  AiPolicyDecision,
  AiPolicyRule,
  Consent,
  ContextPackage,
  InstitutionConsentPolicy,
} from '../src/index.ts';

describe('policy and context contracts', () => {
  it('supports insufficient cohort signals in policy decisions', () => {
    const decision = AiPolicyDecision.parse({
      allowed: false,
      requiresHumanReview: true,
      reason: 'Cohort signal suppressed below disclosure threshold.',
      policyVersion: 2,
      signalQualityClass: 'insufficient_n',
    });

    expect(decision.allowed).toBe(false);
    expect(decision.policyVersion).toBe(2);
  });

  it('models tenant consent policy disclosure thresholds', () => {
    const now = new Date();
    const policy = InstitutionConsentPolicy.parse({
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      defaultPosture: 'explicit_only',
      jurisdictionProfile: 'ferpa_k12',
      ageGateEnabled: true,
      reconsentTriggers: ['provider_change', 'new_action_type'],
      minNForDisclosure: 5,
      createdAt: now,
      updatedAt: now,
    });

    expect(policy.minNForDisclosure).toBe(5);
  });

  it('rejects granted consent records without grant evidence', () => {
    const now = new Date();

    expect(() =>
      Consent.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        subjectId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        actionType: 'ai_analysis',
        scope: 'tenant',
        scopeId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        state: 'granted',
        grantedBy: null,
        grantedAt: null,
        revokedAt: null,
        expiresAt: null,
        evidence: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/granted consent requires/i);
  });

  it('rejects granted consent records that were already revoked', () => {
    const now = new Date();

    expect(() =>
      Consent.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        subjectId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        actionType: 'ai_analysis',
        scope: 'tenant',
        scopeId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        state: 'granted',
        grantedBy: 'subject',
        grantedAt: now,
        revokedAt: now,
        expiresAt: null,
        evidence: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/granted consent cannot have/i);
  });

  it('models course and assignment AI policy targets', () => {
    const rule = AiPolicyRule.parse({
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      actionIdentifier: 'feedback_draft',
      version: 2,
      targetType: 'assignment',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      enabled: true,
      riskLevel: 'medium',
      scope: 'single',
      requiresHumanReview: true,
      requiresExplicitConsent: true,
      minCohortSizeForDisclosure: 5,
    });

    expect(rule.targetType).toBe('assignment');
  });

  it('keeps AI context immutable and policy-stamped', () => {
    const now = new Date();
    const contextPackage = ContextPackage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      actionIdentifier: 'feedback_draft',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      resources: [
        {
          resourceType: 'rubric',
          resourceId: 'rubric-1',
          title: 'Evidence rubric',
          body: 'Explain how evidence supports the claim.',
          metadata: { version: 1 },
        },
      ],
      policyStamp: {
        allowed: true,
        requiresHumanReview: true,
        reason: 'Policy allows feedback drafts with instructor review.',
        policyVersion: 2,
        signalQualityClass: 'partial',
      },
      createdAt: now,
    });

    expect(contextPackage.policyStamp.requiresHumanReview).toBe(true);
    expect(contextPackage.policyStamp.policyVersion).toBe(2);
    expect(contextPackage.policyStamp.signalQualityClass).toBe('partial');
  });
});
