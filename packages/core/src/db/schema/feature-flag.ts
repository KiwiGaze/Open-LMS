import { sql } from 'drizzle-orm';
import { boolean, check, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenant } from './tenant.ts';

export const tenantFeatureFlag = pgTable(
  'tenant_feature_flag',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantKeyUnique: uniqueIndex('tenant_feature_flag_tenant_key_uq').on(table.tenantId, table.key),
    keyFormatCheck: check(
      'tenant_feature_flag_key_format_check',
      sql`${table.key} ~ '^[a-z][a-z0-9_.:-]{1,79}$'`,
    ),
    descriptionLengthCheck: check(
      'tenant_feature_flag_description_length_check',
      sql`${table.description} IS NULL OR (length(${table.description}) >= 1 AND length(${table.description}) <= 500)`,
    ),
  }),
);

export type TenantFeatureFlagRow = typeof tenantFeatureFlag.$inferSelect;
export type NewTenantFeatureFlagRow = typeof tenantFeatureFlag.$inferInsert;
