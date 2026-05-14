import type { UserId } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const conversationThread = pgTable(
  'conversation_thread',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id').references(() => course.id, { onDelete: 'cascade' }),
    subject: text('subject').notNull(),
    status: text('status').notNull(),
    participantIds: jsonb('participant_ids').$type<UserId[]>().notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('conversation_thread_tenant_id_uq').on(table.tenantId, table.id),
    participantIdsIndex: index('conversation_thread_participant_ids_gin_idx').using(
      'gin',
      table.participantIds,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'conversation_thread_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const conversationMessage = pgTable(
  'conversation_message',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    threadId: text('thread_id')
      .notNull()
      .references(() => conversationThread.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('conversation_message_tenant_id_uq').on(table.tenantId, table.id),
    tenantThreadForeignKey: foreignKey({
      name: 'conversation_message_tenant_thread_fk',
      columns: [table.tenantId, table.threadId],
      foreignColumns: [conversationThread.tenantId, conversationThread.id],
    }).onDelete('cascade'),
  }),
);
