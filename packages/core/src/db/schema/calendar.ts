import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const courseCalendarEvent = pgTable(
  'course_calendar_event',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    visibility: text('visibility').notNull(),
    recurrenceRule: text('recurrence_rule'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_calendar_event_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('course_calendar_event_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_calendar_event_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    visibilityCheck: check(
      'course_calendar_event_visibility_check',
      sql`${table.visibility} IN ('draft', 'published', 'archived')`,
    ),
    timeRangeCheck: check(
      'course_calendar_event_time_range_check',
      sql`${table.endsAt} IS NULL OR ${table.endsAt} > ${table.startsAt}`,
    ),
  }),
);

export const courseCalendarEventReminder = pgTable(
  'course_calendar_event_reminder',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => courseCalendarEvent.id, { onDelete: 'cascade' }),
    offsetMinutes: integer('offset_minutes').notNull(),
    remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_calendar_event_reminder_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    pendingUnique: uniqueIndex('course_calendar_event_reminder_pending_uq')
      .on(table.tenantId, table.eventId, table.offsetMinutes)
      .where(sql`${table.sentAt} IS NULL`),
    tenantCourseForeignKey: foreignKey({
      name: 'course_calendar_event_reminder_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantEventForeignKey: foreignKey({
      name: 'course_calendar_event_reminder_tenant_event_fk',
      columns: [table.tenantId, table.eventId],
      foreignColumns: [courseCalendarEvent.tenantId, courseCalendarEvent.id],
    }).onDelete('cascade'),
    tenantCourseEventForeignKey: foreignKey({
      name: 'course_calendar_event_reminder_tenant_course_event_fk',
      columns: [table.tenantId, table.courseId, table.eventId],
      foreignColumns: [
        courseCalendarEvent.tenantId,
        courseCalendarEvent.courseId,
        courseCalendarEvent.id,
      ],
    }).onDelete('cascade'),
    offsetMinutesCheck: check(
      'course_calendar_event_reminder_offset_minutes_check',
      sql`${table.offsetMinutes} BETWEEN 1 AND 10080`,
    ),
  }),
);
