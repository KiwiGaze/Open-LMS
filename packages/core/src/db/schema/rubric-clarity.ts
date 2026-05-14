import type { RubricClarityReviewResult } from '@openlms/contracts';
import { foreignKey, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { contextPackage } from './context-package.ts';
import { rubric } from './rubric.ts';
import { tenant } from './tenant.ts';

export const rubricClarityReview = pgTable(
  'rubric_clarity_review',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    rubricId: text('rubric_id')
      .notNull()
      .references(() => rubric.id, { onDelete: 'cascade' }),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    idempotencyKey: text('idempotency_key').notNull(),
    result: jsonb('result').$type<RubricClarityReviewResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdempotencyUnique: uniqueIndex('rubric_clarity_review_tenant_idempotency_uq').on(
      table.tenantId,
      table.rubricId,
      table.idempotencyKey,
    ),
    tenantRubricForeignKey: foreignKey({
      name: 'rubric_clarity_review_tenant_rubric_fk',
      columns: [table.tenantId, table.rubricId],
      foreignColumns: [rubric.tenantId, rubric.id],
    }).onDelete('cascade'),
    tenantContextPackageForeignKey: foreignKey({
      name: 'rubric_clarity_review_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
  }),
);
