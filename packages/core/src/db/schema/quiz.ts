import type {
  QuizAttemptResponseAnswer,
  QuizQuestionAnswerKey,
  QuizQuestionChoice,
} from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseModule, courseUnit, learningObjective } from './course.ts';
import { tenant } from './tenant.ts';

export const quiz = pgTable(
  'quiz',
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
    description: text('description'),
    status: text('status').notNull(),
    opensAt: timestamp('opens_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    timeLimitMinutes: integer('time_limit_minutes'),
    shuffleQuestions: boolean('shuffle_questions').notNull().default(false),
    maxAttempts: integer('max_attempts').notNull(),
    gradingMethod: text('grading_method').notNull().default('best'),
    proctoringRequired: boolean('proctoring_required').notNull().default(false),
    accessPasswordHash: text('access_password_hash'),
    allowedIpRanges: jsonb('allowed_ip_ranges')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_tenant_id_uq').on(table.tenantId, table.id),
    timeLimitPositiveCheck: check(
      'quiz_time_limit_minutes_positive_check',
      sql`${table.timeLimitMinutes} IS NULL OR ${table.timeLimitMinutes} > 0`,
    ),
    maxAttemptsPositiveCheck: check(
      'quiz_max_attempts_positive_check',
      sql`${table.maxAttempts} > 0`,
    ),
    gradingMethodCheck: check(
      'quiz_grading_method_check',
      sql`${table.gradingMethod} IN ('best', 'last', 'first', 'average')`,
    ),
    accessPasswordHashLengthCheck: check(
      'quiz_access_password_hash_length_check',
      sql`${table.accessPasswordHash} IS NULL OR char_length(${table.accessPasswordHash}) BETWEEN 1 AND 512`,
    ),
    allowedIpRangesArrayCheck: check(
      'quiz_allowed_ip_ranges_array_check',
      sql`jsonb_typeof(${table.allowedIpRanges}) = 'array'`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'quiz_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'quiz_tenant_module_fk',
      columns: [table.tenantId, table.courseId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.courseId, courseModule.id],
    }).onDelete('set null'),
    tenantUnitForeignKey: foreignKey({
      name: 'quiz_tenant_unit_fk',
      columns: [table.tenantId, table.courseId, table.unitId],
      foreignColumns: [courseUnit.tenantId, courseUnit.courseId, courseUnit.id],
    }).onDelete('set null'),
    tenantModuleUnitForeignKey: foreignKey({
      name: 'quiz_tenant_module_unit_fk',
      columns: [table.tenantId, table.courseId, table.moduleId, table.unitId],
      foreignColumns: [
        courseUnit.tenantId,
        courseUnit.courseId,
        courseUnit.moduleId,
        courseUnit.id,
      ],
    }),
    unitRequiresModuleCheck: check(
      'quiz_unit_requires_module_check',
      sql`${table.unitId} IS NULL OR ${table.moduleId} IS NOT NULL`,
    ),
    positionNonnegativeCheck: check(
      'quiz_position_nonnegative_check',
      sql`${table.position} IS NULL OR ${table.position} >= 0`,
    ),
  }),
);

export const questionBank = pgTable(
  'question_bank',
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
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('question_bank_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseStatusTitleIndex: index('question_bank_tenant_course_status_title_idx').on(
      table.tenantId,
      table.courseId,
      table.status,
      table.title,
    ),
    statusCheck: check(
      'question_bank_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'question_bank_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const questionBankQuestion = pgTable(
  'question_bank_question',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    questionBankId: text('question_bank_id')
      .notNull()
      .references(() => questionBank.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    questionType: text('question_type').notNull(),
    prompt: text('prompt').notNull(),
    points: integer('points').notNull(),
    choices: jsonb('choices').$type<QuizQuestionChoice[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('question_bank_question_tenant_id_uq').on(table.tenantId, table.id),
    tenantBankPositionUnique: uniqueIndex('question_bank_question_tenant_bank_position_uq').on(
      table.tenantId,
      table.questionBankId,
      table.position,
    ),
    positionNonnegativeCheck: check(
      'question_bank_question_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    pointsNonnegativeCheck: check(
      'question_bank_question_points_nonnegative_check',
      sql`${table.points} >= 0`,
    ),
    tenantBankForeignKey: foreignKey({
      name: 'question_bank_question_tenant_bank_fk',
      columns: [table.tenantId, table.questionBankId],
      foreignColumns: [questionBank.tenantId, questionBank.id],
    }).onDelete('cascade'),
  }),
);

export const quizOverride = pgTable(
  'quiz_override',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    opensAt: timestamp('opens_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    timeLimitMinutes: integer('time_limit_minutes'),
    maxAttempts: integer('max_attempts'),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_override_tenant_id_uq').on(table.tenantId, table.id),
    tenantQuizTargetUnique: uniqueIndex('quiz_override_tenant_quiz_target_uq').on(
      table.tenantId,
      table.quizId,
      table.targetType,
      table.targetId,
    ),
    targetTypeCheck: check(
      'quiz_override_target_type_check',
      sql`${table.targetType} IN ('user', 'group', 'section')`,
    ),
    targetIdLengthCheck: check(
      'quiz_override_target_id_length_check',
      sql`length(${table.targetId}) > 0`,
    ),
    statusCheck: check(
      'quiz_override_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    availabilityWindowCheck: check(
      'quiz_override_availability_window_check',
      sql`${table.opensAt} IS NULL OR ${table.closesAt} IS NULL OR ${table.closesAt} > ${table.opensAt}`,
    ),
    timeLimitMinutesPositiveCheck: check(
      'quiz_override_time_limit_minutes_positive_check',
      sql`${table.timeLimitMinutes} IS NULL OR ${table.timeLimitMinutes} > 0`,
    ),
    maxAttemptsPositiveCheck: check(
      'quiz_override_max_attempts_positive_check',
      sql`${table.maxAttempts} IS NULL OR ${table.maxAttempts} > 0`,
    ),
    tenantQuizForeignKey: foreignKey({
      name: 'quiz_override_tenant_quiz_fk',
      columns: [table.tenantId, table.quizId],
      foreignColumns: [quiz.tenantId, quiz.id],
    }).onDelete('cascade'),
  }),
);

export const quizQuestion = pgTable(
  'quiz_question',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    questionType: text('question_type').notNull(),
    prompt: text('prompt').notNull(),
    points: integer('points').notNull(),
    choices: jsonb('choices').$type<QuizQuestionChoice[]>().notNull(),
    answerKey: jsonb('answer_key').$type<QuizQuestionAnswerKey>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_question_tenant_id_uq').on(table.tenantId, table.id),
    tenantQuizIdUnique: uniqueIndex('quiz_question_tenant_quiz_id_uq').on(
      table.tenantId,
      table.quizId,
      table.id,
    ),
    tenantQuizPositionUnique: uniqueIndex('quiz_question_tenant_quiz_position_uq').on(
      table.tenantId,
      table.quizId,
      table.position,
    ),
    positionNonnegativeCheck: check(
      'quiz_question_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    pointsNonnegativeCheck: check(
      'quiz_question_points_nonnegative_check',
      sql`${table.points} >= 0`,
    ),
    tenantQuizForeignKey: foreignKey({
      name: 'quiz_question_tenant_quiz_fk',
      columns: [table.tenantId, table.quizId],
      foreignColumns: [quiz.tenantId, quiz.id],
    }).onDelete('cascade'),
  }),
);

export const quizAttempt = pgTable(
  'quiz_attempt',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull(),
    status: text('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    score: integer('score'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_attempt_tenant_id_uq').on(table.tenantId, table.id),
    tenantQuizIdUnique: uniqueIndex('quiz_attempt_tenant_quiz_id_uq').on(
      table.tenantId,
      table.quizId,
      table.id,
    ),
    tenantQuizStudentAttemptUnique: uniqueIndex('quiz_attempt_tenant_quiz_student_attempt_uq').on(
      table.tenantId,
      table.quizId,
      table.studentId,
      table.attemptNumber,
    ),
    attemptNumberPositiveCheck: check(
      'quiz_attempt_attempt_number_positive_check',
      sql`${table.attemptNumber} > 0`,
    ),
    scoreNonnegativeCheck: check(
      'quiz_attempt_score_nonnegative_check',
      sql`${table.score} IS NULL OR ${table.score} >= 0`,
    ),
    tenantQuizForeignKey: foreignKey({
      name: 'quiz_attempt_tenant_quiz_fk',
      columns: [table.tenantId, table.quizId],
      foreignColumns: [quiz.tenantId, quiz.id],
    }).onDelete('cascade'),
  }),
);

export const quizAttemptProbe = pgTable(
  'quiz_attempt_probe',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => quizAttempt.id, { onDelete: 'cascade' }),
    learningObjectiveId: text('learning_objective_id')
      .notNull()
      .references(() => learningObjective.id, { onDelete: 'restrict' }),
    sourceQuestionBankQuestionId: text('source_question_bank_question_id').references(
      () => questionBankQuestion.id,
      { onDelete: 'set null' },
    ),
    position: integer('position').notNull(),
    difficultyTarget: real('difficulty_target').notNull(),
    prompt: text('prompt').notNull(),
    renderModel: jsonb('render_model').$type<Record<string, unknown>>().notNull(),
    points: integer('points').notNull(),
    answerKey: jsonb('answer_key').$type<QuizQuestionAnswerKey>(),
    aiGenerationLogId: text('ai_generation_log_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_attempt_probe_tenant_id_uq').on(table.tenantId, table.id),
    tenantQuizAttemptIdUnique: uniqueIndex('quiz_attempt_probe_tenant_quiz_attempt_id_uq').on(
      table.tenantId,
      table.quizId,
      table.attemptId,
      table.id,
    ),
    tenantAttemptPositionUnique: uniqueIndex('quiz_attempt_probe_tenant_attempt_position_uq').on(
      table.tenantId,
      table.attemptId,
      table.position,
    ),
    tenantQuizAttemptForeignKey: foreignKey({
      name: 'quiz_attempt_probe_tenant_quiz_attempt_fk',
      columns: [table.tenantId, table.quizId, table.attemptId],
      foreignColumns: [quizAttempt.tenantId, quizAttempt.quizId, quizAttempt.id],
    }).onDelete('cascade'),
    tenantLearningObjectiveForeignKey: foreignKey({
      name: 'quiz_attempt_probe_tenant_learning_objective_fk',
      columns: [table.tenantId, table.learningObjectiveId],
      foreignColumns: [learningObjective.tenantId, learningObjective.id],
    }).onDelete('restrict'),
    tenantSourceQuestionBankQuestionForeignKey: foreignKey({
      name: 'quiz_attempt_probe_tenant_source_question_bank_question_fk',
      columns: [table.tenantId, table.sourceQuestionBankQuestionId],
      foreignColumns: [questionBankQuestion.tenantId, questionBankQuestion.id],
    }).onDelete('set null'),
    positionNonnegativeCheck: check(
      'quiz_attempt_probe_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    difficultyTargetRangeCheck: check(
      'quiz_attempt_probe_difficulty_target_range_check',
      sql`${table.difficultyTarget} >= 0 AND ${table.difficultyTarget} <= 1`,
    ),
    pointsNonnegativeCheck: check(
      'quiz_attempt_probe_points_nonnegative_check',
      sql`${table.points} >= 0`,
    ),
  }),
);

export const quizAttemptProbeResponse = pgTable(
  'quiz_attempt_probe_response',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => quizAttempt.id, { onDelete: 'cascade' }),
    probeId: text('probe_id')
      .notNull()
      .references(() => quizAttemptProbe.id, { onDelete: 'cascade' }),
    answer: jsonb('answer').$type<QuizAttemptResponseAnswer>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_attempt_probe_response_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantAttemptProbeUnique: uniqueIndex('quiz_attempt_probe_response_tenant_attempt_probe_uq').on(
      table.tenantId,
      table.attemptId,
      table.probeId,
    ),
    tenantQuizAttemptForeignKey: foreignKey({
      name: 'quiz_attempt_probe_response_tenant_quiz_attempt_fk',
      columns: [table.tenantId, table.quizId, table.attemptId],
      foreignColumns: [quizAttempt.tenantId, quizAttempt.quizId, quizAttempt.id],
    }).onDelete('cascade'),
    tenantQuizAttemptProbeForeignKey: foreignKey({
      name: 'quiz_attempt_probe_response_tenant_quiz_attempt_probe_fk',
      columns: [table.tenantId, table.quizId, table.attemptId, table.probeId],
      foreignColumns: [
        quizAttemptProbe.tenantId,
        quizAttemptProbe.quizId,
        quizAttemptProbe.attemptId,
        quizAttemptProbe.id,
      ],
    }).onDelete('cascade'),
  }),
);

export const quizAttemptResponse = pgTable(
  'quiz_attempt_response',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => quizAttempt.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => quizQuestion.id, { onDelete: 'cascade' }),
    answer: jsonb('answer').$type<QuizAttemptResponseAnswer>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_attempt_response_tenant_id_uq').on(table.tenantId, table.id),
    tenantAttemptQuestionUnique: uniqueIndex('quiz_attempt_response_tenant_attempt_question_uq').on(
      table.tenantId,
      table.attemptId,
      table.questionId,
    ),
    tenantAttemptForeignKey: foreignKey({
      name: 'quiz_attempt_response_tenant_attempt_fk',
      columns: [table.tenantId, table.attemptId],
      foreignColumns: [quizAttempt.tenantId, quizAttempt.id],
    }).onDelete('cascade'),
    tenantQuestionForeignKey: foreignKey({
      name: 'quiz_attempt_response_tenant_question_fk',
      columns: [table.tenantId, table.questionId],
      foreignColumns: [quizQuestion.tenantId, quizQuestion.id],
    }).onDelete('cascade'),
    tenantQuizAttemptForeignKey: foreignKey({
      name: 'quiz_attempt_response_tenant_quiz_attempt_fk',
      columns: [table.tenantId, table.quizId, table.attemptId],
      foreignColumns: [quizAttempt.tenantId, quizAttempt.quizId, quizAttempt.id],
    }).onDelete('cascade'),
    tenantQuizQuestionForeignKey: foreignKey({
      name: 'quiz_attempt_response_tenant_quiz_question_fk',
      columns: [table.tenantId, table.quizId, table.questionId],
      foreignColumns: [quizQuestion.tenantId, quizQuestion.quizId, quizQuestion.id],
    }).onDelete('cascade'),
  }),
);

export const quizAttemptQuestionGrade = pgTable(
  'quiz_attempt_question_grade',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    quizId: text('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => quizAttempt.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => quizQuestion.id, { onDelete: 'cascade' }),
    graderId: text('grader_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    score: integer('score').notNull(),
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('quiz_attempt_question_grade_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantAttemptQuestionUnique: uniqueIndex(
      'quiz_attempt_question_grade_tenant_attempt_question_uq',
    ).on(table.tenantId, table.attemptId, table.questionId),
    scoreNonnegativeCheck: check(
      'quiz_attempt_question_grade_score_nonnegative_check',
      sql`${table.score} >= 0`,
    ),
    feedbackLengthCheck: check(
      'quiz_attempt_question_grade_feedback_length_check',
      sql`${table.feedback} IS NULL OR char_length(${table.feedback}) BETWEEN 1 AND 4000`,
    ),
    tenantQuizAttemptForeignKey: foreignKey({
      name: 'quiz_attempt_question_grade_tenant_quiz_attempt_fk',
      columns: [table.tenantId, table.quizId, table.attemptId],
      foreignColumns: [quizAttempt.tenantId, quizAttempt.quizId, quizAttempt.id],
    }).onDelete('cascade'),
    tenantQuizQuestionForeignKey: foreignKey({
      name: 'quiz_attempt_question_grade_tenant_quiz_question_fk',
      columns: [table.tenantId, table.quizId, table.questionId],
      foreignColumns: [quizQuestion.tenantId, quizQuestion.quizId, quizQuestion.id],
    }).onDelete('cascade'),
  }),
);
