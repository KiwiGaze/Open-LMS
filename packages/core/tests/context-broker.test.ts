import { describe, expect, it } from 'vitest';
import { buildContextPackage } from '../src/context/broker.ts';

describe('context broker', () => {
  it('builds a minimal policy-stamped context package for AI', () => {
    const contextPackage = buildContextPackage(
      {
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        actorId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        actionIdentifier: 'feedback_draft',
        policyDecision: {
          allowed: true,
          requiresHumanReview: true,
          reason: 'AI action allowed by policy.',
          policyVersion: 3,
          signalQualityClass: 'partial',
        },
        resources: [
          {
            resourceType: 'submission',
            resourceId: 'submission-1',
            title: 'Essay submission',
            body: 'The claim is supported by one quote.',
            metadata: { version: 1 },
          },
        ],
      },
      new Date('2026-05-10T00:00:00.000Z'),
    );

    expect(contextPackage.actionIdentifier).toBe('feedback_draft');
    expect(contextPackage.policyStamp.requiresHumanReview).toBe(true);
    expect(contextPackage.policyStamp.policyVersion).toBe(3);
    expect(contextPackage.policyStamp.signalQualityClass).toBe('partial');
  });

  it('refuses to construct context when policy blocks the action', () => {
    expect(() =>
      buildContextPackage({
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        actorId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        actionIdentifier: 'feedback_draft',
        policyDecision: {
          allowed: false,
          requiresHumanReview: true,
          reason: 'Required consent is missing or no longer valid.',
          policyVersion: 3,
          signalQualityClass: null,
        },
        resources: [
          {
            resourceType: 'submission',
            resourceId: 'submission-1',
            title: 'Essay submission',
            body: 'The claim is supported by one quote.',
            metadata: {},
          },
        ],
      }),
    ).toThrow(/blocked by policy/);
  });
});
