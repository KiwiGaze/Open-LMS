import type { SubmissionPrecheckResult } from '@openlms/contracts';
import { foreignKey, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { contextPackage } from './context-package.ts';
import { submission } from './submission.ts';
import { tenant } from './tenant.ts';

export const submissionPrecheck = pgTable(
  'submission_precheck',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    idempotencyKey: text('idempotency_key').notNull(),
    result: jsonb('result').$type<SubmissionPrecheckResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdempotencyUnique: uniqueIndex('submission_precheck_tenant_idempotency_uq').on(
      table.tenantId,
      table.submissionId,
      table.idempotencyKey,
    ),
    tenantSubmissionForeignKey: foreignKey({
      name: 'submission_precheck_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantContextPackageForeignKey: foreignKey({
      name: 'submission_precheck_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
  }),
);
