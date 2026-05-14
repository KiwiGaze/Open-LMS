import { sql } from 'drizzle-orm';
import { foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseSection } from './course.ts';
import { tenant } from './tenant.ts';

export const courseSectionMember = pgTable(
  'course_section_member',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    sectionId: text('section_id')
      .notNull()
      .references(() => courseSection.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_section_member_tenant_id_uq').on(table.tenantId, table.id),
    tenantSectionStudentUnique: uniqueIndex('course_section_member_tenant_section_student_uq').on(
      table.tenantId,
      table.sectionId,
      table.studentId,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_section_member_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantSectionForeignKey: foreignKey({
      name: 'course_section_member_tenant_section_fk',
      columns: [table.tenantId, table.sectionId],
      foreignColumns: [courseSection.tenantId, courseSection.id],
    }).onDelete('cascade'),
  }),
);

export const courseSectionInstructor = pgTable(
  'course_section_instructor',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    sectionId: text('section_id')
      .notNull()
      .references(() => courseSection.id, { onDelete: 'cascade' }),
    instructorId: text('instructor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_section_instructor_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantSectionInstructorUnique: uniqueIndex(
      'course_section_instructor_tenant_section_instructor_uq',
    ).on(table.tenantId, table.sectionId, table.instructorId),
    tenantCourseForeignKey: foreignKey({
      name: 'course_section_instructor_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantSectionForeignKey: foreignKey({
      name: 'course_section_instructor_tenant_section_fk',
      columns: [table.tenantId, table.sectionId],
      foreignColumns: [courseSection.tenantId, courseSection.id],
    }).onDelete('cascade'),
  }),
);
