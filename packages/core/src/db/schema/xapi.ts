import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const xapiStatement = pgTable(
  'xapi_statement',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    statementId: text('statement_id').notNull(),
    receivedById: text('received_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    actor: jsonb('actor').$type<Record<string, unknown>>().notNull(),
    verb: jsonb('verb').$type<Record<string, unknown>>().notNull(),
    object: jsonb('object').$type<Record<string, unknown>>().notNull(),
    result: jsonb('result').$type<Record<string, unknown> | null>(),
    context: jsonb('context').$type<Record<string, unknown> | null>(),
    timestamp: timestamp('timestamp', { withTimezone: true }),
    storedAt: timestamp('stored_at', { withTimezone: true }).notNull().default(sql`now()`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('xapi_statement_tenant_id_uq').on(table.tenantId, table.id),
    tenantStatementUnique: uniqueIndex('xapi_statement_tenant_statement_uq').on(
      table.tenantId,
      table.statementId,
    ),
  }),
);
