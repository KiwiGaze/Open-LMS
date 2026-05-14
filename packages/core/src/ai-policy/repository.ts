import { AiPolicyRule, type AiPolicyRule as AiPolicyRuleContract } from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { type AiPolicyRuleRow, aiPolicyRule } from '../db/schema/ai-policy.ts';

const toIntegerFlag = (value: boolean): number => (value ? 1 : 0);
const fromIntegerFlag = (value: number): boolean => value === 1;

const toAiPolicyRule = (row: AiPolicyRuleRow): AiPolicyRuleContract =>
  AiPolicyRule.parse({
    tenantId: row.tenantId,
    actionIdentifier: row.actionIdentifier,
    version: row.version,
    targetType: row.targetType,
    targetId: row.targetType === 'tenant' ? null : row.targetId,
    enabled: fromIntegerFlag(row.enabled),
    riskLevel: row.riskLevel,
    scope: row.scope,
    requiresHumanReview: fromIntegerFlag(row.requiresHumanReview),
    requiresExplicitConsent: fromIntegerFlag(row.requiresExplicitConsent),
    minCohortSizeForDisclosure: row.minCohortSizeForDisclosure,
  });

const toStoredTargetId = (rule: AiPolicyRuleContract): string => {
  if (rule.targetType === 'tenant') {
    return rule.tenantId;
  }

  if (!rule.targetId) {
    throw new Error('Course and assignment AI policy rules require a target id.');
  }

  return rule.targetId;
};

export const saveAiPolicyRule = async (
  db: Database,
  value: AiPolicyRuleContract,
): Promise<AiPolicyRuleContract> => {
  const parsed = AiPolicyRule.parse(value);
  const targetId = toStoredTargetId(parsed);
  const [row] = await db
    .insert(aiPolicyRule)
    .values({
      tenantId: parsed.tenantId,
      actionIdentifier: parsed.actionIdentifier,
      version: parsed.version,
      targetType: parsed.targetType,
      targetId,
      enabled: toIntegerFlag(parsed.enabled),
      riskLevel: parsed.riskLevel,
      scope: parsed.scope,
      requiresHumanReview: toIntegerFlag(parsed.requiresHumanReview),
      requiresExplicitConsent: toIntegerFlag(parsed.requiresExplicitConsent),
      minCohortSizeForDisclosure: parsed.minCohortSizeForDisclosure,
    })
    .onConflictDoUpdate({
      target: [
        aiPolicyRule.tenantId,
        aiPolicyRule.actionIdentifier,
        aiPolicyRule.targetType,
        aiPolicyRule.targetId,
      ],
      set: {
        enabled: toIntegerFlag(parsed.enabled),
        version: parsed.version,
        riskLevel: parsed.riskLevel,
        scope: parsed.scope,
        requiresHumanReview: toIntegerFlag(parsed.requiresHumanReview),
        requiresExplicitConsent: toIntegerFlag(parsed.requiresExplicitConsent),
        minCohortSizeForDisclosure: parsed.minCohortSizeForDisclosure,
      },
    })
    .returning();

  if (!row) {
    throw new Error('AI policy rule could not be saved because the database returned no row.');
  }

  return toAiPolicyRule(row);
};

export const getAiPolicyRuleByAction = async (
  db: Database,
  tenantId: string,
  actionIdentifier: string,
): Promise<AiPolicyRuleContract | null> => {
  const [row] = await db
    .select()
    .from(aiPolicyRule)
    .where(
      and(
        eq(aiPolicyRule.tenantId, tenantId),
        eq(aiPolicyRule.actionIdentifier, actionIdentifier),
        eq(aiPolicyRule.targetType, 'tenant'),
        eq(aiPolicyRule.targetId, tenantId),
      ),
    )
    .limit(1);

  return row ? toAiPolicyRule(row) : null;
};

export type ResolveAiPolicyRuleInput = {
  tenantId: string;
  actionIdentifier: string;
  courseId: string | null;
  assignmentId: string | null;
};

export const resolveAiPolicyRule = async (
  db: Database,
  input: ResolveAiPolicyRuleInput,
): Promise<AiPolicyRuleContract | null> => {
  const rows = await db
    .select()
    .from(aiPolicyRule)
    .where(
      and(
        eq(aiPolicyRule.tenantId, input.tenantId),
        eq(aiPolicyRule.actionIdentifier, input.actionIdentifier),
      ),
    )
    .orderBy(aiPolicyRule.targetType);

  const rules = rows.map((row) => toAiPolicyRule(row));

  return (
    rules.find(
      (rule) => rule.targetType === 'assignment' && rule.targetId === input.assignmentId,
    ) ??
    rules.find((rule) => rule.targetType === 'course' && rule.targetId === input.courseId) ??
    rules.find((rule) => rule.targetType === 'tenant') ??
    null
  );
};
