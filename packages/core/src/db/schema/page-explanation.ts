import type { PageExplanationResult } from '@openlms/contracts';
import { foreignKey, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { contextPackage } from './context-package.ts';
import { coursePage } from './course.ts';
import { tenant } from './tenant.ts';

export const pageExplanation = pgTable(
  'page_explanation',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    coursePageId: text('course_page_id')
      .notNull()
      .references(() => coursePage.id, { onDelete: 'cascade' }),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    idempotencyKey: text('idempotency_key').notNull(),
    result: jsonb('result').$type<PageExplanationResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdempotencyUnique: uniqueIndex('page_explanation_tenant_idempotency_uq').on(
      table.tenantId,
      table.coursePageId,
      table.idempotencyKey,
    ),
    tenantCoursePageForeignKey: foreignKey({
      name: 'page_explanation_tenant_course_page_fk',
      columns: [table.tenantId, table.coursePageId],
      foreignColumns: [coursePage.tenantId, coursePage.id],
    }).onDelete('cascade'),
    tenantContextPackageForeignKey: foreignKey({
      name: 'page_explanation_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
  }),
);
