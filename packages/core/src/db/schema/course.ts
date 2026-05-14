import type { CourseSectionMeetingDay } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const course = pgTable(
  'course',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    status: text('status').notNull(),
    catalogVisibility: text('catalog_visibility').notNull().default('private'),
    enrollmentCode: text('enrollment_code'),
    catalogCategory: text('catalog_category'),
    academicTerm: text('academic_term'),
    maxEnrollments: integer('max_enrollments'),
    waitlistEnabled: boolean('waitlist_enabled').notNull().default(false),
    enrollmentApprovalRequired: boolean('enrollment_approval_required').notNull().default(false),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    isBlueprint: boolean('is_blueprint').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_tenant_id_uq').on(table.tenantId, table.id),
    tenantCodeUnique: uniqueIndex('course_tenant_code_uq').on(table.tenantId, table.code),
    catalogVisibilityCheck: check(
      'course_catalog_visibility_check',
      sql`${table.catalogVisibility} IN ('private', 'listed')`,
    ),
    statusCheck: check(
      'course_status_check',
      sql`${table.status} IN ('draft', 'active', 'archived', 'deleted')`,
    ),
    deletedAtStatusCheck: check(
      'course_deleted_at_status_check',
      sql`((${table.status} = 'deleted' AND ${table.deletedAt} IS NOT NULL) OR (${table.status} <> 'deleted' AND ${table.deletedAt} IS NULL))`,
    ),
    maxEnrollmentsPositiveCheck: check(
      'course_max_enrollments_positive_check',
      sql`${table.maxEnrollments} IS NULL OR ${table.maxEnrollments} > 0`,
    ),
  }),
);

export const courseSection = pgTable(
  'course_section',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: text('status').notNull(),
    position: integer('position').notNull(),
    meetingDays: jsonb('meeting_days').$type<CourseSectionMeetingDay[]>().notNull().default([]),
    meetingStartTime: text('meeting_start_time'),
    meetingEndTime: text('meeting_end_time'),
    location: text('location'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_section_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'course_section_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    meetingDaysArrayCheck: check(
      'course_section_meeting_days_array_check',
      sql`jsonb_typeof(${table.meetingDays}) = 'array'`,
    ),
    meetingTimePairCheck: check(
      'course_section_meeting_time_pair_check',
      sql`CASE WHEN jsonb_typeof(${table.meetingDays}) = 'array' THEN ((jsonb_array_length(${table.meetingDays}) = 0 AND ${table.meetingStartTime} IS NULL AND ${table.meetingEndTime} IS NULL) OR (jsonb_array_length(${table.meetingDays}) > 0 AND ${table.meetingStartTime} IS NOT NULL AND ${table.meetingEndTime} IS NOT NULL)) ELSE false END`,
    ),
    meetingStartTimeFormatCheck: check(
      'course_section_meeting_start_time_format_check',
      sql`${table.meetingStartTime} IS NULL OR ${table.meetingStartTime} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    ),
    meetingEndTimeFormatCheck: check(
      'course_section_meeting_end_time_format_check',
      sql`${table.meetingEndTime} IS NULL OR ${table.meetingEndTime} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    ),
    meetingTimeOrderCheck: check(
      'course_section_meeting_time_order_check',
      sql`${table.meetingStartTime} IS NULL OR ${table.meetingEndTime} IS NULL OR ${table.meetingEndTime} > ${table.meetingStartTime}`,
    ),
  }),
);

export const courseSyllabus = pgTable(
  'course_syllabus',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    visibility: text('visibility').notNull(),
    version: integer('version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_syllabus_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseUnique: uniqueIndex('course_syllabus_tenant_course_uq').on(
      table.tenantId,
      table.courseId,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_syllabus_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    bodyLengthCheck: check('course_syllabus_body_length_check', sql`length(${table.body}) > 0`),
    visibilityCheck: check(
      'course_syllabus_visibility_check',
      sql`${table.visibility} IN ('draft', 'published', 'archived')`,
    ),
    versionPositiveCheck: check(
      'course_syllabus_version_positive_check',
      sql`${table.version} > 0`,
    ),
  }),
);

export const courseModule = pgTable(
  'course_module',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    summary: text('summary'),
    visibility: text('visibility').notNull(),
    accessPolicy: text('access_policy').notNull(),
    version: integer('version').notNull(),
    position: integer('position').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('course_module_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const courseUnit = pgTable(
  'course_unit',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    summary: text('summary'),
    visibility: text('visibility').notNull(),
    accessPolicy: text('access_policy').notNull(),
    version: integer('version').notNull(),
    position: integer('position').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_unit_tenant_id_uq').on(table.tenantId, table.id),
    tenantModuleIdUnique: uniqueIndex('course_unit_tenant_module_id_uq').on(
      table.tenantId,
      table.moduleId,
      table.id,
    ),
    tenantCourseIdUnique: uniqueIndex('course_unit_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCourseModuleIdUnique: uniqueIndex('course_unit_tenant_course_module_id_uq').on(
      table.tenantId,
      table.courseId,
      table.moduleId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_unit_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_unit_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
  }),
);

export const courseResource = pgTable(
  'course_resource',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id').references(() => courseModule.id, { onDelete: 'set null' }),
    unitId: text('unit_id').references(() => courseUnit.id, { onDelete: 'set null' }),
    resourceType: text('resource_type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    sourceUri: text('source_uri'),
    visibility: text('visibility').notNull(),
    accessPolicy: text('access_policy').notNull(),
    version: integer('version').notNull(),
    position: integer('position').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_resource_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'course_resource_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_resource_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('set null'),
    tenantUnitForeignKey: foreignKey({
      name: 'course_resource_tenant_unit_fk',
      columns: [table.tenantId, table.unitId],
      foreignColumns: [courseUnit.tenantId, courseUnit.id],
    }).onDelete('set null'),
    tenantModuleUnitForeignKey: foreignKey({
      name: 'course_resource_tenant_module_unit_fk',
      columns: [table.tenantId, table.moduleId, table.unitId],
      foreignColumns: [courseUnit.tenantId, courseUnit.moduleId, courseUnit.id],
    }),
    unitRequiresModuleCheck: check(
      'course_resource_unit_requires_module_check',
      sql`${table.unitId} IS NULL OR ${table.moduleId} IS NOT NULL`,
    ),
    positionNonnegativeCheck: check(
      'course_resource_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
  }),
);

export const learningObjective = pgTable(
  'learning_objective',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull(),
    position: integer('position').notNull(),
    masteryThresholdPercent: real('mastery_threshold_percent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantCourseCodeUnique: uniqueIndex('learning_objective_tenant_course_code_uq').on(
      table.tenantId,
      table.courseId,
      table.code,
    ),
    tenantIdUnique: uniqueIndex('learning_objective_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('learning_objective_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'learning_objective_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    masteryThresholdRangeCheck: check(
      'learning_objective_mastery_threshold_percent_range_check',
      sql`${table.masteryThresholdPercent} IS NULL OR (${table.masteryThresholdPercent} >= 0 AND ${table.masteryThresholdPercent} <= 100)`,
    ),
  }),
);

export const learningObjectiveMastery = pgTable(
  'learning_objective_mastery',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    learningObjectiveId: text('learning_objective_id')
      .notNull()
      .references(() => learningObjective.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    score: real('score'),
    maxScore: real('max_score'),
    lastAssessedAt: timestamp('last_assessed_at', { withTimezone: true }),
    evidenceCount: integer('evidence_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('learning_objective_mastery_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantCourseObjectiveStudentUnique: uniqueIndex(
      'learning_objective_mastery_tenant_course_objective_student_uq',
    ).on(table.tenantId, table.courseId, table.learningObjectiveId, table.studentId),
    tenantCourseForeignKey: foreignKey({
      name: 'learning_objective_mastery_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantCourseObjectiveForeignKey: foreignKey({
      name: 'learning_objective_mastery_tenant_course_objective_fk',
      columns: [table.tenantId, table.courseId, table.learningObjectiveId],
      foreignColumns: [
        learningObjective.tenantId,
        learningObjective.courseId,
        learningObjective.id,
      ],
    }).onDelete('cascade'),
    statusCheck: check(
      'learning_objective_mastery_status_check',
      sql`${table.status} IN ('not_assessed', 'developing', 'proficient', 'mastered')`,
    ),
    evidenceCountNonnegativeCheck: check(
      'learning_objective_mastery_evidence_count_nonnegative_check',
      sql`${table.evidenceCount} >= 0`,
    ),
    scorePairCheck: check(
      'learning_objective_mastery_score_pair_check',
      sql`((${table.score} IS NULL AND ${table.maxScore} IS NULL) OR (${table.score} IS NOT NULL AND ${table.maxScore} IS NOT NULL))`,
    ),
    scoreBoundsCheck: check(
      'learning_objective_mastery_score_bounds_check',
      sql`${table.score} IS NULL OR (${table.score} >= 0 AND ${table.maxScore} > 0 AND ${table.score} <= ${table.maxScore})`,
    ),
    scoreFiniteCheck: check(
      'learning_objective_mastery_score_finite_check',
      sql`(${table.score} IS NULL OR ${table.score}::text NOT IN ('NaN', 'Infinity', '-Infinity')) AND (${table.maxScore} IS NULL OR ${table.maxScore}::text NOT IN ('NaN', 'Infinity', '-Infinity'))`,
    ),
  }),
);

export const coursePage = pgTable(
  'course_page',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    visibility: text('visibility').notNull(),
    version: integer('version').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_page_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'course_page_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);
