import type {
  CourseGradingSchemeEntry,
  CriterionFeedback,
  FeedbackDialogueMessageAuthorRole,
  FeedbackDialogueStatus,
} from '@openlms/contracts';
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
import { aiGenerationLog } from './ai-log.ts';
import { assignment } from './assignment.ts';
import { user } from './auth.ts';
import { contextPackage } from './context-package.ts';
import { course } from './course.ts';
import { submission } from './submission.ts';
import { tenant } from './tenant.ts';

export const aiFeedbackDraft = pgTable(
  'ai_feedback_draft',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    contextPackageId: text('context_package_id')
      .notNull()
      .references(() => contextPackage.id, { onDelete: 'restrict' }),
    aiGenerationLogId: text('ai_generation_log_id').notNull(),
    promptIdentifier: text('prompt_identifier').notNull(),
    promptVersion: text('prompt_version').notNull(),
    providerType: text('provider_type').notNull(),
    model: text('model').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    status: text('status').notNull(),
    criterionFeedback: jsonb('criterion_feedback').$type<CriterionFeedback[]>().notNull(),
    overallComment: text('overall_comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdempotencyUnique: uniqueIndex('ai_feedback_draft_tenant_idempotency_uq').on(
      table.tenantId,
      table.submissionId,
      table.idempotencyKey,
    ),
    tenantIdUnique: uniqueIndex('ai_feedback_draft_tenant_id_uq').on(table.tenantId, table.id),
    tenantSubmissionForeignKey: foreignKey({
      name: 'ai_feedback_draft_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantContextPackageForeignKey: foreignKey({
      name: 'ai_feedback_draft_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
    tenantAiGenerationLogForeignKey: foreignKey({
      name: 'ai_feedback_draft_tenant_ai_generation_log_fk',
      columns: [table.tenantId, table.aiGenerationLogId],
      foreignColumns: [aiGenerationLog.tenantId, aiGenerationLog.id],
    }).onDelete('restrict'),
  }),
);

export const humanReview = pgTable(
  'human_review',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    aiFeedbackDraftId: text('ai_feedback_draft_id')
      .notNull()
      .references(() => aiFeedbackDraft.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    decision: text('decision').notNull(),
    editedCriterionFeedback: jsonb('edited_criterion_feedback')
      .$type<CriterionFeedback[]>()
      .notNull(),
    editedOverallComment: text('edited_overall_comment'),
    reviewerNote: text('reviewer_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantAiFeedbackDraftUnique: uniqueIndex('human_review_tenant_ai_feedback_draft_uq').on(
      table.tenantId,
      table.aiFeedbackDraftId,
    ),
    tenantIdUnique: uniqueIndex('human_review_tenant_id_uq').on(table.tenantId, table.id),
    tenantAiFeedbackDraftForeignKey: foreignKey({
      name: 'human_review_tenant_ai_feedback_draft_fk',
      columns: [table.tenantId, table.aiFeedbackDraftId],
      foreignColumns: [aiFeedbackDraft.tenantId, aiFeedbackDraft.id],
    }).onDelete('cascade'),
  }),
);

export const grade = pgTable(
  'grade',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    score: real('score').notNull(),
    maxScore: real('max_score').notNull(),
    status: text('status').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('grade_tenant_id_uq').on(table.tenantId, table.id),
    tenantSubmissionUnique: uniqueIndex('grade_tenant_submission_uq').on(
      table.tenantId,
      table.submissionId,
    ),
    tenantIdSubmissionUnique: uniqueIndex('grade_tenant_id_submission_uq').on(
      table.tenantId,
      table.id,
      table.submissionId,
    ),
    scoreNonnegativeCheck: check('grade_score_nonnegative_check', sql`${table.score} >= 0`),
    maxScorePositiveCheck: check('grade_max_score_positive_check', sql`${table.maxScore} > 0`),
    scoreMaxScoreCheck: check(
      'grade_score_lte_max_score_check',
      sql`${table.score} <= ${table.maxScore}`,
    ),
    statusCheck: check(
      'grade_status_check',
      sql`${table.status} IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete')`,
    ),
    tenantSubmissionForeignKey: foreignKey({
      name: 'grade_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
  }),
);

export const gradeHistory = pgTable(
  'grade_history',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    gradeId: text('grade_id')
      .notNull()
      .references(() => grade.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    previousScore: real('previous_score'),
    previousMaxScore: real('previous_max_score'),
    previousStatus: text('previous_status'),
    previousSource: text('previous_source'),
    score: real('score').notNull(),
    maxScore: real('max_score').notNull(),
    status: text('status').notNull(),
    source: text('source').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('grade_history_tenant_id_uq').on(table.tenantId, table.id),
    tenantSubmissionCreatedAtIndex: uniqueIndex('grade_history_tenant_submission_created_id_uq').on(
      table.tenantId,
      table.submissionId,
      table.createdAt,
      table.id,
    ),
    scoreNonnegativeCheck: check('grade_history_score_nonnegative_check', sql`${table.score} >= 0`),
    maxScorePositiveCheck: check(
      'grade_history_max_score_positive_check',
      sql`${table.maxScore} > 0`,
    ),
    scoreMaxScoreCheck: check(
      'grade_history_score_lte_max_score_check',
      sql`${table.score} <= ${table.maxScore}`,
    ),
    previousGradeFieldsCheck: check(
      'grade_history_previous_fields_all_or_none_check',
      sql`(${table.previousScore} IS NULL AND ${table.previousMaxScore} IS NULL AND ${table.previousStatus} IS NULL AND ${table.previousSource} IS NULL) OR (${table.previousScore} IS NOT NULL AND ${table.previousMaxScore} IS NOT NULL AND ${table.previousStatus} IS NOT NULL AND ${table.previousSource} IS NOT NULL)`,
    ),
    previousScoreMaxScoreCheck: check(
      'grade_history_previous_score_lte_max_score_check',
      sql`${table.previousScore} IS NULL OR ${table.previousScore} <= ${table.previousMaxScore}`,
    ),
    statusCheck: check(
      'grade_history_status_check',
      sql`${table.status} IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete')`,
    ),
    sourceCheck: check(
      'grade_history_source_check',
      sql`${table.source} IN ('manual', 'imported', 'ai_assisted_draft_reviewed_by_human')`,
    ),
    previousStatusCheck: check(
      'grade_history_previous_status_check',
      sql`${table.previousStatus} IS NULL OR ${table.previousStatus} IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete')`,
    ),
    previousSourceCheck: check(
      'grade_history_previous_source_check',
      sql`${table.previousSource} IS NULL OR ${table.previousSource} IN ('manual', 'imported', 'ai_assisted_draft_reviewed_by_human')`,
    ),
    reasonLengthCheck: check(
      'grade_history_reason_length_check',
      sql`${table.reason} IS NULL OR length(${table.reason}) BETWEEN 1 AND 2000`,
    ),
    tenantGradeForeignKey: foreignKey({
      name: 'grade_history_tenant_grade_fk',
      columns: [table.tenantId, table.gradeId],
      foreignColumns: [grade.tenantId, grade.id],
    }).onDelete('cascade'),
    tenantSubmissionForeignKey: foreignKey({
      name: 'grade_history_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
  }),
);

export const gradeAppeal = pgTable(
  'grade_appeal',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    gradeId: text('grade_id')
      .notNull()
      .references(() => grade.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    status: text('status').notNull(),
    reason: text('reason').notNull(),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('grade_appeal_tenant_id_uq').on(table.tenantId, table.id),
    tenantGradeStudentOpenUnique: uniqueIndex('grade_appeal_tenant_grade_student_open_uq')
      .on(table.tenantId, table.gradeId, table.studentId)
      .where(sql`${table.status} IN ('open', 'under_review')`),
    statusCheck: check(
      'grade_appeal_status_check',
      sql`${table.status} IN ('open', 'under_review', 'resolved', 'rejected', 'cancelled')`,
    ),
    reasonLengthCheck: check(
      'grade_appeal_reason_length_check',
      sql`length(${table.reason}) BETWEEN 1 AND 4000`,
    ),
    resolutionLengthCheck: check(
      'grade_appeal_resolution_length_check',
      sql`${table.resolution} IS NULL OR length(${table.resolution}) BETWEEN 1 AND 4000`,
    ),
    resolutionStatusCheck: check(
      'grade_appeal_resolution_status_check',
      sql`(${table.status} IN ('resolved', 'rejected') AND ${table.resolution} IS NOT NULL AND ${table.resolvedAt} IS NOT NULL) OR (${table.status} NOT IN ('resolved', 'rejected') AND ${table.resolvedAt} IS NULL)`,
    ),
    tenantGradeForeignKey: foreignKey({
      name: 'grade_appeal_tenant_grade_fk',
      columns: [table.tenantId, table.gradeId],
      foreignColumns: [grade.tenantId, grade.id],
    }).onDelete('cascade'),
    tenantSubmissionForeignKey: foreignKey({
      name: 'grade_appeal_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantGradeSubmissionForeignKey: foreignKey({
      name: 'grade_appeal_tenant_grade_submission_fk',
      columns: [table.tenantId, table.gradeId, table.submissionId],
      foreignColumns: [grade.tenantId, grade.id, grade.submissionId],
    }).onDelete('cascade'),
  }),
);

export const gradebookCategory = pgTable(
  'gradebook_category',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull(),
    weightPercent: real('weight_percent'),
    dropLowest: integer('drop_lowest').notNull().default(0),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('gradebook_category_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('gradebook_category_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCoursePositionUnique: uniqueIndex('gradebook_category_tenant_course_position_uq').on(
      table.tenantId,
      table.courseId,
      table.position,
    ),
    nameLengthCheck: check(
      'gradebook_category_name_length_check',
      sql`length(${table.name}) BETWEEN 1 AND 180`,
    ),
    positionNonnegativeCheck: check(
      'gradebook_category_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    weightPercentRangeCheck: check(
      'gradebook_category_weight_percent_range_check',
      sql`${table.weightPercent} IS NULL OR (${table.weightPercent} >= 0 AND ${table.weightPercent} <= 100)`,
    ),
    dropLowestNonnegativeCheck: check(
      'gradebook_category_drop_lowest_nonnegative_check',
      sql`${table.dropLowest} >= 0`,
    ),
    statusCheck: check(
      'gradebook_category_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'gradebook_category_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const assignmentGradebookCategory = pgTable(
  'assignment_gradebook_category',
  {
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    gradebookCategoryId: text('gradebook_category_id')
      .notNull()
      .references(() => gradebookCategory.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantAssignmentUnique: uniqueIndex('assignment_gradebook_category_tenant_assignment_uq').on(
      table.tenantId,
      table.assignmentId,
    ),
    tenantCourseAssignmentForeignKey: foreignKey({
      name: 'assignment_gradebook_category_tenant_course_assignment_fk',
      columns: [table.tenantId, table.courseId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.courseId, assignment.id],
    }).onDelete('cascade'),
    tenantCourseCategoryForeignKey: foreignKey({
      name: 'assignment_gradebook_category_tenant_course_category_fk',
      columns: [table.tenantId, table.courseId, table.gradebookCategoryId],
      foreignColumns: [
        gradebookCategory.tenantId,
        gradebookCategory.courseId,
        gradebookCategory.id,
      ],
    }).onDelete('cascade'),
  }),
);

export const gradebookManualItem = pgTable(
  'gradebook_manual_item',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    gradebookCategoryId: text('gradebook_category_id').references(() => gradebookCategory.id, {
      onDelete: 'restrict',
    }),
    title: text('title').notNull(),
    description: text('description'),
    maxScore: real('max_score').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    position: integer('position').notNull(),
    status: text('status').notNull(),
    extraCredit: boolean('extra_credit').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('gradebook_manual_item_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('gradebook_manual_item_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCoursePositionUnique: uniqueIndex('gradebook_manual_item_tenant_course_position_uq').on(
      table.tenantId,
      table.courseId,
      table.position,
    ),
    titleLengthCheck: check(
      'gradebook_manual_item_title_length_check',
      sql`length(${table.title}) BETWEEN 1 AND 180`,
    ),
    descriptionLengthCheck: check(
      'gradebook_manual_item_description_length_check',
      sql`${table.description} IS NULL OR length(${table.description}) BETWEEN 1 AND 2000`,
    ),
    maxScorePositiveCheck: check(
      'gradebook_manual_item_max_score_positive_check',
      sql`${table.maxScore} > 0`,
    ),
    maxScoreFiniteCheck: check(
      'gradebook_manual_item_max_score_finite_check',
      sql`${table.maxScore}::text NOT IN ('NaN', 'Infinity', '-Infinity')`,
    ),
    positionNonnegativeCheck: check(
      'gradebook_manual_item_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    statusCheck: check(
      'gradebook_manual_item_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'gradebook_manual_item_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantCourseCategoryForeignKey: foreignKey({
      name: 'gradebook_manual_item_tenant_course_category_fk',
      columns: [table.tenantId, table.courseId, table.gradebookCategoryId],
      foreignColumns: [
        gradebookCategory.tenantId,
        gradebookCategory.courseId,
        gradebookCategory.id,
      ],
    }).onDelete('restrict'),
  }),
);

export const gradebookManualGrade = pgTable(
  'gradebook_manual_grade',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    gradebookManualItemId: text('gradebook_manual_item_id')
      .notNull()
      .references(() => gradebookManualItem.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    score: real('score').notNull(),
    maxScore: real('max_score').notNull(),
    status: text('status').notNull(),
    source: text('source').notNull(),
    gradedAt: timestamp('graded_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('gradebook_manual_grade_tenant_id_uq').on(table.tenantId, table.id),
    tenantItemStudentUnique: uniqueIndex('gradebook_manual_grade_tenant_item_student_uq').on(
      table.tenantId,
      table.gradebookManualItemId,
      table.studentId,
    ),
    scoreNonnegativeCheck: check(
      'gradebook_manual_grade_score_nonnegative_check',
      sql`${table.score} >= 0`,
    ),
    maxScorePositiveCheck: check(
      'gradebook_manual_grade_max_score_positive_check',
      sql`${table.maxScore} > 0`,
    ),
    scoreMaxScoreCheck: check(
      'gradebook_manual_grade_score_lte_max_score_check',
      sql`${table.score} <= ${table.maxScore}`,
    ),
    scoreFiniteCheck: check(
      'gradebook_manual_grade_score_finite_check',
      sql`${table.score}::text NOT IN ('NaN', 'Infinity', '-Infinity') AND ${table.maxScore}::text NOT IN ('NaN', 'Infinity', '-Infinity')`,
    ),
    statusCheck: check(
      'gradebook_manual_grade_status_check',
      sql`${table.status} IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete')`,
    ),
    sourceCheck: check(
      'gradebook_manual_grade_source_check',
      sql`${table.source} IN ('manual', 'imported', 'ai_assisted_draft_reviewed_by_human')`,
    ),
    tenantItemForeignKey: foreignKey({
      name: 'gradebook_manual_grade_tenant_item_fk',
      columns: [table.tenantId, table.gradebookManualItemId],
      foreignColumns: [gradebookManualItem.tenantId, gradebookManualItem.id],
    }).onDelete('cascade'),
  }),
);

export const courseGradingScheme = pgTable(
  'course_grading_scheme',
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
    entries: jsonb('entries').$type<CourseGradingSchemeEntry[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_grading_scheme_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseNameUnique: uniqueIndex('course_grading_scheme_tenant_course_name_uq').on(
      table.tenantId,
      table.courseId,
      table.name,
    ),
    nameLengthCheck: check(
      'course_grading_scheme_name_length_check',
      sql`length(${table.name}) BETWEEN 1 AND 180`,
    ),
    statusCheck: check(
      'course_grading_scheme_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    entriesNonemptyCheck: check(
      'course_grading_scheme_entries_nonempty_check',
      sql`jsonb_typeof(${table.entries}) = 'array' AND jsonb_array_length(${table.entries}) > 0`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_grading_scheme_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const publishedFeedback = pgTable(
  'published_feedback',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    humanReviewId: text('human_review_id').references(() => humanReview.id, {
      onDelete: 'set null',
    }),
    criterionFeedback: jsonb('criterion_feedback').$type<CriterionFeedback[]>().notNull(),
    overallComment: text('overall_comment'),
    linkedGradeId: text('linked_grade_id').references(() => grade.id, { onDelete: 'set null' }),
    version: integer('version').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    humanReviewUnique: uniqueIndex('published_feedback_human_review_id_uq').on(table.humanReviewId),
    tenantIdUnique: uniqueIndex('published_feedback_tenant_id_uq').on(table.tenantId, table.id),
    tenantIdSubmissionUnique: uniqueIndex('published_feedback_tenant_id_submission_uq').on(
      table.tenantId,
      table.id,
      table.submissionId,
    ),
    tenantSubmissionVersionUnique: uniqueIndex(
      'published_feedback_tenant_submission_version_uq',
    ).on(table.tenantId, table.submissionId, table.version),
    tenantSubmissionForeignKey: foreignKey({
      name: 'published_feedback_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantHumanReviewForeignKey: foreignKey({
      name: 'published_feedback_tenant_human_review_fk',
      columns: [table.tenantId, table.humanReviewId],
      foreignColumns: [humanReview.tenantId, humanReview.id],
    }).onDelete('set null'),
    tenantLinkedGradeForeignKey: foreignKey({
      name: 'published_feedback_tenant_linked_grade_fk',
      columns: [table.tenantId, table.linkedGradeId],
      foreignColumns: [grade.tenantId, grade.id],
    }).onDelete('set null'),
    tenantLinkedGradeSubmissionForeignKey: foreignKey({
      name: 'published_feedback_tenant_linked_grade_submission_fk',
      columns: [table.tenantId, table.linkedGradeId, table.submissionId],
      foreignColumns: [grade.tenantId, grade.id, grade.submissionId],
    }).onDelete('set null'),
  }),
);

export const feedbackDialogue = pgTable(
  'feedback_dialogue',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    publishedFeedbackId: text('published_feedback_id')
      .notNull()
      .references(() => publishedFeedback.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    status: text('status').$type<FeedbackDialogueStatus>().notNull(),
    openedById: text('opened_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('feedback_dialogue_tenant_id_uq').on(table.tenantId, table.id),
    tenantPublishedFeedbackUnique: uniqueIndex('feedback_dialogue_tenant_published_feedback_uq').on(
      table.tenantId,
      table.publishedFeedbackId,
    ),
    tenantPublishedFeedbackForeignKey: foreignKey({
      name: 'feedback_dialogue_tenant_published_feedback_fk',
      columns: [table.tenantId, table.publishedFeedbackId],
      foreignColumns: [publishedFeedback.tenantId, publishedFeedback.id],
    }).onDelete('cascade'),
    tenantSubmissionForeignKey: foreignKey({
      name: 'feedback_dialogue_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantPublishedFeedbackSubmissionForeignKey: foreignKey({
      name: 'feedback_dialogue_tenant_published_feedback_submission_fk',
      columns: [table.tenantId, table.publishedFeedbackId, table.submissionId],
      foreignColumns: [
        publishedFeedback.tenantId,
        publishedFeedback.id,
        publishedFeedback.submissionId,
      ],
    }).onDelete('cascade'),
    statusCheck: check(
      'feedback_dialogue_status_check',
      sql`${table.status} IN ('open', 'closed')`,
    ),
  }),
);

export const feedbackDialogueMessage = pgTable(
  'feedback_dialogue_message',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    dialogueId: text('dialogue_id')
      .notNull()
      .references(() => feedbackDialogue.id, { onDelete: 'cascade' }),
    authorRole: text('author_role').$type<FeedbackDialogueMessageAuthorRole>().notNull(),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    criterionId: text('criterion_id'),
    body: text('body').notNull(),
    contextPackageId: text('context_package_id').references(() => contextPackage.id, {
      onDelete: 'restrict',
    }),
    aiGenerationLogId: text('ai_generation_log_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('feedback_dialogue_message_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantDialogueForeignKey: foreignKey({
      name: 'feedback_dialogue_message_tenant_dialogue_fk',
      columns: [table.tenantId, table.dialogueId],
      foreignColumns: [feedbackDialogue.tenantId, feedbackDialogue.id],
    }).onDelete('cascade'),
    tenantContextPackageForeignKey: foreignKey({
      name: 'feedback_dialogue_message_tenant_context_package_fk',
      columns: [table.tenantId, table.contextPackageId],
      foreignColumns: [contextPackage.tenantId, contextPackage.id],
    }).onDelete('restrict'),
    tenantAiGenerationLogForeignKey: foreignKey({
      name: 'feedback_dialogue_message_tenant_ai_generation_log_fk',
      columns: [table.tenantId, table.aiGenerationLogId],
      foreignColumns: [aiGenerationLog.tenantId, aiGenerationLog.id],
    }).onDelete('restrict'),
    authorRoleCheck: check(
      'feedback_dialogue_message_author_role_check',
      sql`${table.authorRole} IN ('student', 'instructor', 'ai')`,
    ),
    bodyLengthCheck: check(
      'feedback_dialogue_message_body_length_check',
      sql`length(${table.body}) BETWEEN 1 AND 10000`,
    ),
  }),
);
