import { sql } from 'drizzle-orm';
import { foreignKey, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const userLegalHold = pgTable(
  'user_legal_hold',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    userId: text('user_id').notNull(),
    createdById: text('created_by_id'),
    reason: text('reason').notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantUserIndex: index('user_legal_hold_tenant_user_idx').on(table.tenantId, table.userId),
    activeTenantUserUnique: uniqueIndex('user_legal_hold_active_user_tenant_uq')
      .on(table.tenantId, table.userId)
      .where(sql`${table.releasedAt} IS NULL`),
    tenantForeignKey: foreignKey({
      name: 'user_legal_hold_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenant.id],
    }).onDelete('cascade'),
    userForeignKey: foreignKey({
      name: 'user_legal_hold_user_fk',
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete('cascade'),
    createdByForeignKey: foreignKey({
      name: 'user_legal_hold_created_by_fk',
      columns: [table.createdById],
      foreignColumns: [user.id],
    }).onDelete('set null'),
  }),
);

export type UserLegalHoldRow = typeof userLegalHold.$inferSelect;
export type NewUserLegalHoldRow = typeof userLegalHold.$inferInsert;
