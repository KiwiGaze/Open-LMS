import type { SurveyQuestionChoice, SurveyResponseAnswer } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const survey = pgTable(
  'survey',
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
    opensAt: timestamp('opens_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    allowsAnonymousResponses: boolean('allows_anonymous_responses').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('survey_tenant_id_uq').on(table.tenantId, table.id),
    statusCheck: check(
      'survey_status_check',
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'survey_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const surveyQuestion = pgTable(
  'survey_question',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    surveyId: text('survey_id')
      .notNull()
      .references(() => survey.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    questionType: text('question_type').notNull(),
    prompt: text('prompt').notNull(),
    required: boolean('required').notNull(),
    choices: jsonb('choices').$type<SurveyQuestionChoice[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('survey_question_tenant_id_uq').on(table.tenantId, table.id),
    tenantSurveyPositionUnique: uniqueIndex('survey_question_tenant_survey_position_uq').on(
      table.tenantId,
      table.surveyId,
      table.position,
    ),
    positionNonnegativeCheck: check(
      'survey_question_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    questionTypeCheck: check(
      'survey_question_question_type_check',
      sql`${table.questionType} IN ('single_choice', 'multi_choice', 'free_text', 'rating_scale')`,
    ),
    tenantSurveyForeignKey: foreignKey({
      name: 'survey_question_tenant_survey_fk',
      columns: [table.tenantId, table.surveyId],
      foreignColumns: [survey.tenantId, survey.id],
    }).onDelete('cascade'),
  }),
);

export const surveyResponse = pgTable(
  'survey_response',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    surveyId: text('survey_id')
      .notNull()
      .references(() => survey.id, { onDelete: 'cascade' }),
    surveyQuestionId: text('survey_question_id')
      .notNull()
      .references(() => surveyQuestion.id, { onDelete: 'cascade' }),
    respondentId: text('respondent_id').references(() => user.id, { onDelete: 'set null' }),
    answer: jsonb('answer').$type<SurveyResponseAnswer>().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('survey_response_tenant_id_uq').on(table.tenantId, table.id),
    tenantQuestionRespondentUnique: uniqueIndex('survey_response_tenant_question_respondent_uq').on(
      table.tenantId,
      table.surveyQuestionId,
      table.respondentId,
    ),
    tenantSurveyForeignKey: foreignKey({
      name: 'survey_response_tenant_survey_fk',
      columns: [table.tenantId, table.surveyId],
      foreignColumns: [survey.tenantId, survey.id],
    }).onDelete('cascade'),
    tenantQuestionForeignKey: foreignKey({
      name: 'survey_response_tenant_question_fk',
      columns: [table.tenantId, table.surveyQuestionId],
      foreignColumns: [surveyQuestion.tenantId, surveyQuestion.id],
    }).onDelete('cascade'),
  }),
);
