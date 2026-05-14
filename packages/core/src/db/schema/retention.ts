import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenant } from './tenant.ts';

export const retentionPolicy = pgTable(
  'retention_policy',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    targetType: text('target_type').notNull(),
    retainDays: integer('retain_days').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantTargetUnique: uniqueIndex('retention_policy_tenant_target_uq').on(
      table.tenantId,
      table.targetType,
    ),
    tenantForeignKey: foreignKey({
      name: 'retention_policy_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenant.id],
    }).onDelete('cascade'),
    targetTypeCheck: check(
      'retention_policy_target_type_check',
      sql`${table.targetType} IN ('deleted_user')`,
    ),
    retainDaysCheck: check(
      'retention_policy_retain_days_check',
      sql`${table.retainDays} >= 0 AND ${table.retainDays} <= 3650`,
    ),
  }),
);

export type RetentionPolicyRow = typeof retentionPolicy.$inferSelect;
export type NewRetentionPolicyRow = typeof retentionPolicy.$inferInsert;
