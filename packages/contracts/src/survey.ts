import { z } from 'zod';
import { CourseId, SurveyId, SurveyQuestionId, SurveyResponseId, TenantId, UserId } from './ids.ts';

export const SurveyStatus = z.enum(['draft', 'published', 'archived']);
export type SurveyStatus = z.infer<typeof SurveyStatus>;

export const Survey = z.object({
  id: SurveyId,
  tenantId: TenantId,
  courseId: CourseId,
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(4_000).nullable(),
  status: SurveyStatus,
  opensAt: z.date().nullable(),
  closesAt: z.date().nullable(),
  allowsAnonymousResponses: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Survey = z.infer<typeof Survey>;

export const SurveyQuestionType = z.enum([
  'single_choice',
  'multi_choice',
  'free_text',
  'rating_scale',
]);
export type SurveyQuestionType = z.infer<typeof SurveyQuestionType>;

export const SurveyQuestionChoice = z
  .object({
    id: z.string().min(1).max(64),
    text: z.string().min(1).max(1_000),
  })
  .strict();
export type SurveyQuestionChoice = z.infer<typeof SurveyQuestionChoice>;

export const SurveyQuestion = z.object({
  id: SurveyQuestionId,
  tenantId: TenantId,
  surveyId: SurveyId,
  position: z.number().int().nonnegative(),
  questionType: SurveyQuestionType,
  prompt: z.string().min(1),
  required: z.boolean(),
  choices: z.array(SurveyQuestionChoice),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SurveyQuestion = z.infer<typeof SurveyQuestion>;

export const SurveyResponseAnswer = z.union([
  z.object({ kind: z.literal('single_choice'), choiceId: z.string().min(1).max(64) }).strict(),
  z
    .object({
      kind: z.literal('multi_choice'),
      choiceIds: z.array(z.string().min(1).max(64)).min(1),
    })
    .strict(),
  z.object({ kind: z.literal('free_text'), text: z.string().min(1).max(8_000) }).strict(),
  z.object({ kind: z.literal('rating_scale'), value: z.number().int().min(1).max(10) }).strict(),
]);
export type SurveyResponseAnswer = z.infer<typeof SurveyResponseAnswer>;

export const SurveyResponse = z.object({
  id: SurveyResponseId,
  tenantId: TenantId,
  surveyId: SurveyId,
  surveyQuestionId: SurveyQuestionId,
  respondentId: UserId.nullable(),
  answer: SurveyResponseAnswer,
  submittedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SurveyResponse = z.infer<typeof SurveyResponse>;
