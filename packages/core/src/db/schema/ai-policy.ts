import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenant } from './tenant.ts';

export const aiPolicyRule = pgTable(
  'ai_policy_rule',
  {
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    actionIdentifier: text('action_identifier').notNull(),
    version: integer('version').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    enabled: integer('enabled').notNull(),
    riskLevel: text('risk_level').notNull(),
    scope: text('scope').notNull(),
    requiresHumanReview: integer('requires_human_review').notNull(),
    requiresExplicitConsent: integer('requires_explicit_consent').notNull(),
    minCohortSizeForDisclosure: integer('min_cohort_size_for_disclosure').notNull(),
  },
  (table) => ({
    versionPositiveCheck: check('ai_policy_rule_version_positive_check', sql`${table.version} > 0`),
    tenantActionTargetUnique: uniqueIndex('ai_policy_rule_tenant_action_target_uq').on(
      table.tenantId,
      table.actionIdentifier,
      table.targetType,
      table.targetId,
    ),
  }),
);

export type AiPolicyRuleRow = typeof aiPolicyRule.$inferSelect;
