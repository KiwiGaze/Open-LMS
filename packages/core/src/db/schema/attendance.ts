import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const attendanceSession = pgTable(
  'attendance_session',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('attendance_session_tenant_id_uq').on(table.tenantId, table.id),
    timeRangeCheck: check(
      'attendance_session_time_range_check',
      sql`${table.endsAt} > ${table.startsAt}`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'attendance_session_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const attendanceRecord = pgTable(
  'attendance_record',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    sessionId: text('session_id')
      .notNull()
      .references(() => attendanceSession.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    note: text('note'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('attendance_record_tenant_id_uq').on(table.tenantId, table.id),
    tenantSessionStudentUnique: uniqueIndex('attendance_record_tenant_session_student_uq').on(
      table.tenantId,
      table.sessionId,
      table.studentId,
    ),
    tenantSessionForeignKey: foreignKey({
      name: 'attendance_record_tenant_session_fk',
      columns: [table.tenantId, table.sessionId],
      foreignColumns: [attendanceSession.tenantId, attendanceSession.id],
    }).onDelete('cascade'),
  }),
);
