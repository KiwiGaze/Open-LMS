import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { contextPackage } from './context-package.ts';
import { tenant } from './tenant.ts';

export const aiGenerationLog = pgTable(
  'ai_generation_log',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    actionIdentifier: text('action_identifier').notNull(),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    promptIdentifier: text('prompt_identifier').notNull(),
    promptVersion: text('prompt_version').notNull(),
    providerType: text('provider_type').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    durationMs: integer('duration_ms').notNull(),
    retryCount: integer('retry_count').notNull(),
    fallbackUsed: boolean('fallback_used').notNull().default(false),
    estimatedCostCents: real('estimated_cost_cents'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('ai_generation_log_tenant_id_uq').on(table.tenantId, table.id),
    tenantContextPackageForeignKey: foreignKey({
      name: 'ai_generation_log_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
  }),
);
