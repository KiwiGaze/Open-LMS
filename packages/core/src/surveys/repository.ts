import {
  CourseId,
  Survey,
  type Survey as SurveyContract,
  SurveyId,
  SurveyQuestion,
  type SurveyQuestionChoice,
  type SurveyQuestion as SurveyQuestionContract,
  SurveyQuestionId,
  type SurveyQuestionType,
  SurveyResponse,
  type SurveyResponseAnswer,
  type SurveyResponse as SurveyResponseContract,
  SurveyResponseId,
  type SurveyStatus,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { survey, surveyQuestion, surveyResponse } from '../db/schema/survey.ts';

export type ListSurveysForCourseInput = {
  tenantId: string;
  courseId: string;
};

export type CreateSurveyInput = {
  tenantId: string;
  courseId: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  allowsAnonymousResponses: boolean;
};

export const listSurveysForCourse = async (
  db: Database,
  input: ListSurveysForCourseInput,
): Promise<SurveyContract[]> => {
  const rows = await db
    .select()
    .from(survey)
    .where(and(eq(survey.tenantId, input.tenantId), eq(survey.courseId, input.courseId)))
    .orderBy(asc(survey.title), asc(survey.id));

  return rows.map((row) => Survey.parse(row));
};

export const createSurvey = async (
  db: Database,
  input: CreateSurveyInput,
  now = new Date(),
): Promise<SurveyContract> => {
  const parsed = Survey.parse({
    id: SurveyId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    description: input.description,
    status: input.status,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    allowsAnonymousResponses: input.allowsAnonymousResponses,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(survey).values(parsed).returning();

  if (!row) {
    throw new Error('Survey could not be created because the database returned no row.');
  }

  return Survey.parse(row);
};

export const getSurveyForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  surveyId: string,
): Promise<SurveyContract | null> => {
  const [row] = await db
    .select()
    .from(survey)
    .where(
      and(eq(survey.tenantId, tenantId), eq(survey.courseId, courseId), eq(survey.id, surveyId)),
    )
    .limit(1);

  return row ? Survey.parse(row) : null;
};

export type UpdateSurveyInput = {
  tenantId: string;
  courseId: string;
  surveyId: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  allowsAnonymousResponses: boolean;
};

export const updateSurvey = async (
  db: Database,
  input: UpdateSurveyInput,
  now = new Date(),
): Promise<SurveyContract | null> => {
  const [row] = await db
    .update(survey)
    .set({
      title: input.title,
      description: input.description,
      status: input.status,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      allowsAnonymousResponses: input.allowsAnonymousResponses,
      updatedAt: now,
    })
    .where(
      and(
        eq(survey.tenantId, input.tenantId),
        eq(survey.courseId, input.courseId),
        eq(survey.id, input.surveyId),
      ),
    )
    .returning();

  return row ? Survey.parse(row) : null;
};

export type DeleteSurveyInput = {
  tenantId: string;
  courseId: string;
  surveyId: string;
};

export const deleteSurvey = async (db: Database, input: DeleteSurveyInput): Promise<boolean> => {
  const result = await db
    .delete(survey)
    .where(
      and(
        eq(survey.tenantId, input.tenantId),
        eq(survey.courseId, input.courseId),
        eq(survey.id, input.surveyId),
      ),
    )
    .returning({ id: survey.id });

  return result.length > 0;
};

export type ListSurveyQuestionsForSurveyInput = {
  tenantId: string;
  surveyId: string;
};

export const listSurveyQuestionsForSurvey = async (
  db: Database,
  input: ListSurveyQuestionsForSurveyInput,
): Promise<SurveyQuestionContract[]> => {
  const rows = await db
    .select()
    .from(surveyQuestion)
    .where(
      and(eq(surveyQuestion.tenantId, input.tenantId), eq(surveyQuestion.surveyId, input.surveyId)),
    )
    .orderBy(asc(surveyQuestion.position));

  return rows.map((row) => SurveyQuestion.parse(row));
};

export type CreateSurveyQuestionInput = {
  tenantId: string;
  surveyId: string;
  position: number;
  questionType: SurveyQuestionType;
  prompt: string;
  required: boolean;
  choices: SurveyQuestionChoice[];
};

export const createSurveyQuestion = async (
  db: Database,
  input: CreateSurveyQuestionInput,
  now = new Date(),
): Promise<SurveyQuestionContract> => {
  const parsed = SurveyQuestion.parse({
    id: SurveyQuestionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    surveyId: SurveyId.parse(input.surveyId),
    position: input.position,
    questionType: input.questionType,
    prompt: input.prompt,
    required: input.required,
    choices: input.choices,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(surveyQuestion).values(parsed).returning();

  if (!row) {
    throw new Error('Survey question could not be created because the database returned no row.');
  }

  return SurveyQuestion.parse(row);
};

export const getSurveyQuestionForSurvey = async (
  db: Database,
  tenantId: string,
  surveyId: string,
  surveyQuestionId: string,
): Promise<SurveyQuestionContract | null> => {
  const [row] = await db
    .select()
    .from(surveyQuestion)
    .where(
      and(
        eq(surveyQuestion.tenantId, tenantId),
        eq(surveyQuestion.surveyId, surveyId),
        eq(surveyQuestion.id, surveyQuestionId),
      ),
    )
    .limit(1);

  return row ? SurveyQuestion.parse(row) : null;
};

export type ListSurveyResponsesForSurveyInput = {
  tenantId: string;
  surveyId: string;
};

export const listSurveyResponsesForSurvey = async (
  db: Database,
  input: ListSurveyResponsesForSurveyInput,
): Promise<SurveyResponseContract[]> => {
  const rows = await db
    .select()
    .from(surveyResponse)
    .where(
      and(eq(surveyResponse.tenantId, input.tenantId), eq(surveyResponse.surveyId, input.surveyId)),
    )
    .orderBy(asc(surveyResponse.submittedAt), asc(surveyResponse.id));

  return rows.map((row) => SurveyResponse.parse(row));
};

export type CreateSurveyResponseInput = {
  tenantId: string;
  surveyId: string;
  surveyQuestionId: string;
  respondentId: string | null;
  answer: SurveyResponseAnswer;
};

export const createSurveyResponse = async (
  db: Database,
  input: CreateSurveyResponseInput,
  now = new Date(),
): Promise<SurveyResponseContract> => {
  const parsed = SurveyResponse.parse({
    id: SurveyResponseId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    surveyId: SurveyId.parse(input.surveyId),
    surveyQuestionId: SurveyQuestionId.parse(input.surveyQuestionId),
    respondentId: input.respondentId === null ? null : UserId.parse(input.respondentId),
    answer: input.answer,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(surveyResponse).values(parsed).returning();

  if (!row) {
    throw new Error('Survey response could not be created because the database returned no row.');
  }

  return SurveyResponse.parse(row);
};
