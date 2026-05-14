import { AiPolicyRule, Consent, InstitutionConsentPolicy, type TenantId } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  getAiPolicyRuleByAction,
  resolveAiPolicyRule,
  saveAiPolicyRule,
} from '../src/ai-policy/repository.ts';
import {
  getInstitutionConsentPolicyByTenantId,
  listConsentsForSubject,
  listConsentsForSubjects,
  saveConsent,
  saveInstitutionConsentPolicy,
} from '../src/consents/repository.ts';
import type { Database } from '../src/db/client.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const subjectId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE2X';

const policyRule = AiPolicyRule.parse({
  tenantId,
  actionIdentifier: 'feedback_draft',
  version: 1,
  enabled: true,
  riskLevel: 'medium',
  scope: 'single',
  requiresHumanReview: true,
  requiresExplicitConsent: true,
  minCohortSizeForDisclosure: 5,
});

const policyRuleRow = {
  ...policyRule,
  enabled: 1,
  requiresHumanReview: 1,
  requiresExplicitConsent: 1,
};

const institutionPolicy = InstitutionConsentPolicy.parse({
  tenantId,
  defaultPosture: 'explicit_only',
  jurisdictionProfile: 'us_college',
  ageGateEnabled: false,
  reconsentTriggers: ['provider_change'],
  minNForDisclosure: 5,
  createdAt: now,
  updatedAt: now,
});

const consent = Consent.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  subjectId,
  actionType: 'ai_analysis',
  scope: 'tenant',
  scopeId: tenantId,
  state: 'granted',
  grantedBy: 'subject',
  grantedAt: now,
  revokedAt: null,
  expiresAt: null,
  evidence: 'Accepted AI support policy.',
  createdAt: now,
  updatedAt: now,
});

const createInsertOnlyDb = <T>(row: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [row],
        }),
        returning: async () => [row],
      }),
    }),
  }) as unknown as Database;

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

describe('AI policy repository', () => {
  it('round-trips an AI policy rule through the contract shape', async () => {
    const saved = await saveAiPolicyRule(createInsertOnlyDb(policyRuleRow), policyRule);

    expect(saved).toEqual(policyRule);
  });

  it('returns a tenant action policy rule from storage', async () => {
    const found = await getAiPolicyRuleByAction(
      createSelectOnlyDb([policyRuleRow]),
      tenantId,
      'feedback_draft',
    );

    expect(found).toEqual(policyRule);
  });

  it('resolves the most specific AI policy rule for an assignment context', async () => {
    const courseRule = AiPolicyRule.parse({
      ...policyRule,
      version: 2,
      targetType: 'course',
      targetId: courseId,
      requiresHumanReview: false,
    });
    const assignmentRule = AiPolicyRule.parse({
      ...policyRule,
      version: 3,
      targetType: 'assignment',
      targetId: assignmentId,
      enabled: false,
    });
    const toRow = (rule: AiPolicyRule) => ({
      ...rule,
      enabled: rule.enabled ? 1 : 0,
      requiresHumanReview: rule.requiresHumanReview ? 1 : 0,
      requiresExplicitConsent: rule.requiresExplicitConsent ? 1 : 0,
    });

    const resolved = await resolveAiPolicyRule(
      createSelectOnlyDb([toRow(policyRule), toRow(courseRule), toRow(assignmentRule)]),
      {
        tenantId,
        actionIdentifier: 'feedback_draft',
        courseId,
        assignmentId,
      },
    );

    expect(resolved).toEqual(assignmentRule);
  });
});

describe('consent repository', () => {
  it('round-trips institution consent policy through the contract shape', async () => {
    const saved = await saveInstitutionConsentPolicy(
      createInsertOnlyDb({ ...institutionPolicy, ageGateEnabled: 0 }),
      institutionPolicy,
    );

    expect(saved).toEqual(institutionPolicy);
  });

  it('round-trips consent records through the contract shape', async () => {
    const saved = await saveConsent(createInsertOnlyDb(consent), consent);

    expect(saved).toEqual(consent);
  });

  it('lists consent records for one or many subjects', async () => {
    const single = await listConsentsForSubject(createSelectOnlyDb([consent]), tenantId, subjectId);
    const many = await listConsentsForSubjects(createSelectOnlyDb([consent]), tenantId, [
      subjectId,
    ]);

    expect(single).toEqual([consent]);
    expect(many).toEqual([consent]);
  });

  it('returns an institution consent policy from storage', async () => {
    const found = await getInstitutionConsentPolicyByTenantId(
      createSelectOnlyDb([{ ...institutionPolicy, ageGateEnabled: 0 }]),
      tenantId,
    );

    expect(found).toEqual(institutionPolicy);
  });
});
