import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const courseMeeting = pgTable(
  'course_meeting',
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
    provider: text('provider').notNull(),
    externalUrl: text('external_url').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    recordingUrl: text('recording_url'),
    playbackUrl: text('playback_url'),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_meeting_tenant_id_uq').on(table.tenantId, table.id),
    providerCheck: check(
      'course_meeting_provider_check',
      sql`${table.provider} IN ('bbb', 'zoom', 'teams', 'google_meet', 'other')`,
    ),
    statusCheck: check(
      'course_meeting_status_check',
      sql`${table.status} IN ('scheduled', 'in_progress', 'ended', 'cancelled')`,
    ),
    timeRangeCheck: check(
      'course_meeting_time_range_check',
      sql`${table.endsAt} IS NULL OR ${table.endsAt} > ${table.startsAt}`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_meeting_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);
