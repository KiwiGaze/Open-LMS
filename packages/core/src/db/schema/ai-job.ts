import type { AiJobOutput } from '@openlms/contracts';
import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { contextPackage } from './context-package.ts';
import { tenant } from './tenant.ts';

export const aiJob = pgTable(
  'ai_job',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    actionIdentifier: text('action_identifier').notNull(),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    promptIdentifier: text('prompt_identifier').notNull(),
    promptVersion: text('prompt_version').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    status: text('status').notNull(),
    attempts: integer('attempts').notNull(),
    maxAttempts: integer('max_attempts').notNull(),
    output: jsonb('output').$type<AiJobOutput | null>(),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('ai_job_tenant_id_uq').on(table.tenantId, table.id),
    tenantIdempotencyUnique: uniqueIndex('ai_job_tenant_idempotency_uq').on(
      table.tenantId,
      table.idempotencyKey,
    ),
    tenantContextPackageForeignKey: foreignKey({
      name: 'ai_job_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
  }),
);
