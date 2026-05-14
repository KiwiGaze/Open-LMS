import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
  category: text('category').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const outboxEvent = pgTable('outbox_event', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  eventType: text('event_type').notNull(),
  schemaVersion: text('schema_version').notNull().default('1'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().default(sql`now()`),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
