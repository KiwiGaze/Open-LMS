import type { AssignmentAiSettings } from '@openlms/contracts';
import type { AssignmentAllowedFileExtension } from '@openlms/contracts';
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
import { course, courseModule, courseUnit } from './course.ts';
import { courseGroupSet } from './groups.ts';
import { rubric } from './rubric.ts';
import { tenant } from './tenant.ts';

export const assignment = pgTable(
  'assignment',
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
    position: integer('position'),
    title: text('title').notNull(),
    instructions: text('instructions').notNull(),
    status: text('status').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    allowResubmission: boolean('allow_resubmission').notNull().default(false),
    activeRubricId: text('active_rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
    aiSettings: jsonb('ai_settings').$type<AssignmentAiSettings>().notNull(),
    latePenaltyPercentPerDay: real('late_penalty_percent_per_day'),
    lateMaxPenaltyPercent: real('late_max_penalty_percent'),
    extraCredit: boolean('extra_credit').notNull().default(false),
    anonymousGradingEnabled: boolean('anonymous_grading_enabled').notNull().default(false),
    groupSubmissionEnabled: boolean('group_submission_enabled').notNull().default(false),
    groupSetId: text('group_set_id').references(() => courseGroupSet.id, { onDelete: 'restrict' }),
    allowedFileExtensions: jsonb('allowed_file_extensions')
      .$type<AssignmentAllowedFileExtension[]>()
      .notNull()
      .default([]),
    maxFileSizeBytes: integer('max_file_size_bytes'),
    gradingLocked: boolean('grading_locked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('assignment_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('assignment_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'assignment_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'assignment_tenant_module_fk',
      columns: [table.tenantId, table.courseId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.courseId, courseModule.id],
    }).onDelete('set null'),
    tenantUnitForeignKey: foreignKey({
      name: 'assignment_tenant_unit_fk',
      columns: [table.tenantId, table.courseId, table.unitId],
      foreignColumns: [courseUnit.tenantId, courseUnit.courseId, courseUnit.id],
    }).onDelete('set null'),
    tenantModuleUnitForeignKey: foreignKey({
      name: 'assignment_tenant_module_unit_fk',
      columns: [table.tenantId, table.courseId, table.moduleId, table.unitId],
      foreignColumns: [
        courseUnit.tenantId,
        courseUnit.courseId,
        courseUnit.moduleId,
        courseUnit.id,
      ],
    }),
    tenantActiveRubricForeignKey: foreignKey({
      name: 'assignment_tenant_active_rubric_fk',
      columns: [table.tenantId, table.activeRubricId],
      foreignColumns: [rubric.tenantId, rubric.id],
    }).onDelete('set null'),
    tenantGroupSetForeignKey: foreignKey({
      name: 'assignment_tenant_group_set_fk',
      columns: [table.tenantId, table.courseId, table.groupSetId],
      foreignColumns: [courseGroupSet.tenantId, courseGroupSet.courseId, courseGroupSet.id],
    }).onDelete('restrict'),
    unitRequiresModuleCheck: check(
      'assignment_unit_requires_module_check',
      sql`${table.unitId} IS NULL OR ${table.moduleId} IS NOT NULL`,
    ),
    positionNonnegativeCheck: check(
      'assignment_position_nonnegative_check',
      sql`${table.position} IS NULL OR ${table.position} >= 0`,
    ),
    latePenaltyPercentPerDayRangeCheck: check(
      'assignment_late_penalty_percent_per_day_range_check',
      sql`${table.latePenaltyPercentPerDay} IS NULL OR (${table.latePenaltyPercentPerDay} >= 0 AND ${table.latePenaltyPercentPerDay} <= 100)`,
    ),
    lateMaxPenaltyPercentRangeCheck: check(
      'assignment_late_max_penalty_percent_range_check',
      sql`${table.lateMaxPenaltyPercent} IS NULL OR (${table.lateMaxPenaltyPercent} >= 0 AND ${table.lateMaxPenaltyPercent} <= 100)`,
    ),
    groupSubmissionGroupSetCheck: check(
      'assignment_group_submission_group_set_check',
      sql`(${table.groupSubmissionEnabled} = false AND ${table.groupSetId} IS NULL) OR (${table.groupSubmissionEnabled} = true AND ${table.groupSetId} IS NOT NULL)`,
    ),
    allowedFileExtensionsArrayCheck: check(
      'assignment_allowed_file_extensions_array_check',
      sql`jsonb_typeof(${table.allowedFileExtensions}) = 'array'`,
    ),
    maxFileSizeBytesPositiveCheck: check(
      'assignment_max_file_size_bytes_positive_check',
      sql`${table.maxFileSizeBytes} IS NULL OR ${table.maxFileSizeBytes} > 0`,
    ),
  }),
);

export const assignmentOverride = pgTable(
  'assignment_override',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    opensAt: timestamp('opens_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('assignment_override_tenant_id_uq').on(table.tenantId, table.id),
    tenantAssignmentTargetUnique: uniqueIndex('assignment_override_tenant_assignment_target_uq').on(
      table.tenantId,
      table.assignmentId,
      table.targetType,
      table.targetId,
    ),
    targetTypeCheck: check(
      'assignment_override_target_type_check',
      sql`${table.targetType} IN ('user', 'group', 'section')`,
    ),
    targetIdLengthCheck: check(
      'assignment_override_target_id_length_check',
      sql`length(${table.targetId}) > 0`,
    ),
    statusCheck: check(
      'assignment_override_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    availabilityWindowCheck: check(
      'assignment_override_availability_window_check',
      sql`${table.opensAt} IS NULL OR ${table.closesAt} IS NULL OR ${table.closesAt} > ${table.opensAt}`,
    ),
    tenantAssignmentForeignKey: foreignKey({
      name: 'assignment_override_tenant_assignment_fk',
      columns: [table.tenantId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.id],
    }).onDelete('cascade'),
  }),
);
