import type { AssignmentTrendCardResult } from '@openlms/contracts';
import { foreignKey, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { assignment } from './assignment.ts';
import { contextPackage } from './context-package.ts';
import { tenant } from './tenant.ts';

export const assignmentTrendCard = pgTable(
  'assignment_trend_card',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    idempotencyKey: text('idempotency_key').notNull(),
    result: jsonb('result').$type<AssignmentTrendCardResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdempotencyUnique: uniqueIndex('assignment_trend_card_tenant_idempotency_uq').on(
      table.tenantId,
      table.assignmentId,
      table.idempotencyKey,
    ),
    tenantAssignmentForeignKey: foreignKey({
      name: 'assignment_trend_card_tenant_assignment_fk',
      columns: [table.tenantId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.id],
    }).onDelete('cascade'),
    tenantContextPackageForeignKey: foreignKey({
      name: 'assignment_trend_card_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
  }),
);
