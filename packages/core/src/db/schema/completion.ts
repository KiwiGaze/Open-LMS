import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseModule } from './course.ts';
import { tenant } from './tenant.ts';

export const completionRequirement = pgTable(
  'completion_requirement',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id').references(() => courseModule.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    requirementType: text('requirement_type').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    minScorePercent: real('min_score_percent'),
    status: text('status').notNull(),
    required: boolean('required').notNull().default(true),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('completion_requirement_tenant_id_uq').on(table.tenantId, table.id),
    positionNonnegativeCheck: check(
      'completion_requirement_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'completion_requirement_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'completion_requirement_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    tenantCourseModuleForeignKey: foreignKey({
      name: 'completion_requirement_tenant_course_module_fk',
      columns: [table.tenantId, table.courseId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.courseId, courseModule.id],
    }).onDelete('cascade'),
    requirementTypeCheck: check(
      'completion_requirement_type_check',
      sql`${table.requirementType} IN ('view_resource', 'submit_assignment', 'pass_quiz', 'manual')`,
    ),
    targetTypeCheck: check(
      'completion_requirement_target_type_check',
      sql`${table.targetType} IN ('course_resource', 'assignment', 'quiz', 'manual')`,
    ),
    scoreThresholdRangeCheck: check(
      'completion_requirement_min_score_percent_range_check',
      sql`${table.minScorePercent} IS NULL OR (${table.minScorePercent} >= 0 AND ${table.minScorePercent} <= 100)`,
    ),
    scoreThresholdTypeCheck: check(
      'completion_requirement_min_score_percent_type_check',
      sql`${table.minScorePercent} IS NULL OR ${table.requirementType} = 'pass_quiz'`,
    ),
    passQuizTargetCheck: check(
      'completion_requirement_pass_quiz_target_check',
      sql`${table.requirementType} <> 'pass_quiz' OR (${table.targetType} = 'quiz' AND ${table.targetId} IS NOT NULL)`,
    ),
    manualTargetCheck: check(
      'completion_requirement_manual_target_check',
      sql`${table.requirementType} <> 'manual' OR (${table.targetType} = 'manual' AND ${table.targetId} IS NULL)`,
    ),
  }),
);

export const completionProgress = pgTable(
  'completion_progress',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    requirementId: text('requirement_id')
      .notNull()
      .references(() => completionRequirement.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('completion_progress_tenant_id_uq').on(table.tenantId, table.id),
    tenantRequirementStudentUnique: uniqueIndex(
      'completion_progress_tenant_requirement_student_uq',
    ).on(table.tenantId, table.requirementId, table.studentId),
    tenantRequirementForeignKey: foreignKey({
      name: 'completion_progress_tenant_requirement_fk',
      columns: [table.tenantId, table.requirementId],
      foreignColumns: [completionRequirement.tenantId, completionRequirement.id],
    }).onDelete('cascade'),
  }),
);
