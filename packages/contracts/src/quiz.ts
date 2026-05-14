import { z } from 'zod';
import {
  CourseId,
  CourseModuleId,
  CourseUnitId,
  LearningObjectiveId,
  QuestionBankId,
  QuestionBankQuestionId,
  QuizAttemptId,
  QuizAttemptProbeId,
  QuizAttemptProbeResponseId,
  QuizAttemptQuestionGradeId,
  QuizAttemptResponseId,
  QuizId,
  QuizOverrideId,
  QuizQuestionId,
  TenantId,
  UserId,
} from './ids.ts';

export const QuizStatus = z.enum(['draft', 'published', 'archived']);
export type QuizStatus = z.infer<typeof QuizStatus>;

export const QuizQuestionType = z.enum([
  'multiple_choice',
  'short_answer',
  'essay',
  'true_false',
  'numeric',
  'matching',
]);
export type QuizQuestionType = z.infer<typeof QuizQuestionType>;

export const QuizQuestionChoice = z
  .object({
    id: z.string().min(1).max(64),
    text: z.string().min(1).max(1_000),
  })
  .strict();
export type QuizQuestionChoice = z.infer<typeof QuizQuestionChoice>;

export const QuizQuestionAnswerKey = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('choice'),
      correctChoiceIds: z.array(z.string().min(1).max(64)).min(1).max(50),
    })
    .strict(),
  z
    .object({
      kind: z.literal('text'),
      acceptedAnswers: z.array(z.string().min(1).max(1_000)).min(1).max(50),
      caseSensitive: z.boolean().default(false),
    })
    .strict(),
  z
    .object({
      kind: z.literal('numeric'),
      value: z.number().finite(),
      tolerance: z.number().nonnegative().finite().default(0),
    })
    .strict(),
  z
    .object({
      kind: z.literal('pairs'),
      pairs: z
        .array(
          z
            .object({
              leftId: z.string().min(1).max(64),
              rightId: z.string().min(1).max(64),
            })
            .strict(),
        )
        .min(1)
        .max(50),
    })
    .strict(),
]);
export type QuizQuestionAnswerKey = z.infer<typeof QuizQuestionAnswerKey>;

export const QuestionBankStatus = z.enum(['active', 'archived']);
export type QuestionBankStatus = z.infer<typeof QuestionBankStatus>;

export const QuestionBank = z.object({
  id: QuestionBankId,
  tenantId: TenantId,
  courseId: CourseId,
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(4_000).nullable(),
  status: QuestionBankStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type QuestionBank = z.infer<typeof QuestionBank>;

export const QuestionBankQuestion = z.object({
  id: QuestionBankQuestionId,
  tenantId: TenantId,
  questionBankId: QuestionBankId,
  position: z.number().int().nonnegative(),
  questionType: QuizQuestionType,
  prompt: z.string().min(1),
  points: z.number().int().nonnegative(),
  choices: z.array(QuizQuestionChoice),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type QuestionBankQuestion = z.infer<typeof QuestionBankQuestion>;

export const QuizGradingMethod = z.enum(['best', 'last', 'first', 'average']);
export type QuizGradingMethod = z.infer<typeof QuizGradingMethod>;

export const QuizAllowedIpRange = z.string().trim().min(1).max(64);
export type QuizAllowedIpRange = z.infer<typeof QuizAllowedIpRange>;

export const Quiz = z
  .object({
    id: QuizId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId.nullable().default(null),
    unitId: CourseUnitId.nullable().default(null),
    position: z.number().int().nonnegative().nullable().default(null),
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(4_000).nullable(),
    status: QuizStatus,
    opensAt: z.date().nullable(),
    closesAt: z.date().nullable(),
    timeLimitMinutes: z.number().int().positive().nullable(),
    shuffleQuestions: z.boolean(),
    maxAttempts: z.number().int().positive(),
    gradingMethod: QuizGradingMethod.default('best'),
    proctoringRequired: z.boolean().default(false),
    accessPasswordRequired: z.boolean().default(false),
    allowedIpRanges: z.array(QuizAllowedIpRange).max(50).default([]),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((quiz, context) => {
    if (quiz.unitId !== null && quiz.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit quizzes must include their parent module.',
        path: ['moduleId'],
      });
    }
  });
export type Quiz = z.infer<typeof Quiz>;

export const QuizOverrideTargetType = z.enum(['user', 'group', 'section']);
export type QuizOverrideTargetType = z.infer<typeof QuizOverrideTargetType>;

export const QuizOverrideStatus = z.enum(['active', 'archived']);
export type QuizOverrideStatus = z.infer<typeof QuizOverrideStatus>;

export const QuizOverride = z
  .object({
    id: QuizOverrideId,
    tenantId: TenantId,
    quizId: QuizId,
    targetType: QuizOverrideTargetType,
    targetId: z.string().min(1),
    opensAt: z.date().nullable(),
    closesAt: z.date().nullable(),
    timeLimitMinutes: z.number().int().positive().nullable(),
    maxAttempts: z.number().int().positive().nullable(),
    status: QuizOverrideStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((override, context) => {
    if (
      override.opensAt !== null &&
      override.closesAt !== null &&
      override.closesAt.getTime() <= override.opensAt.getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quiz override closesAt must be after opensAt.',
        path: ['closesAt'],
      });
    }
  });
export type QuizOverride = z.infer<typeof QuizOverride>;

export const QuizEffectiveSettings = z
  .object({
    quizId: QuizId,
    opensAt: z.date().nullable(),
    closesAt: z.date().nullable(),
    timeLimitMinutes: z.number().int().positive().nullable(),
    maxAttempts: z.number().int().positive(),
  })
  .strict();
export type QuizEffectiveSettings = z.infer<typeof QuizEffectiveSettings>;

export const QuizQuestion = z.object({
  id: QuizQuestionId,
  tenantId: TenantId,
  quizId: QuizId,
  position: z.number().int().nonnegative(),
  questionType: QuizQuestionType,
  prompt: z.string().min(1),
  points: z.number().int().nonnegative(),
  choices: z.array(QuizQuestionChoice),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type QuizQuestion = z.infer<typeof QuizQuestion>;

export const QuizAttemptStatus = z.enum(['in_progress', 'submitted', 'graded', 'abandoned']);
export type QuizAttemptStatus = z.infer<typeof QuizAttemptStatus>;

export const QuizAggregateGrade = z
  .object({
    quizId: QuizId,
    studentId: UserId,
    gradingMethod: QuizGradingMethod,
    aggregateScore: z.number().nonnegative().nullable(),
    attemptCount: z.number().int().nonnegative(),
    latestAttemptAt: z.date().nullable(),
  })
  .strict();
export type QuizAggregateGrade = z.infer<typeof QuizAggregateGrade>;

export const QuizAttempt = z.object({
  id: QuizAttemptId,
  tenantId: TenantId,
  quizId: QuizId,
  studentId: UserId,
  attemptNumber: z.number().int().positive(),
  status: QuizAttemptStatus,
  startedAt: z.date(),
  submittedAt: z.date().nullable(),
  score: z.number().nonnegative().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type QuizAttempt = z.infer<typeof QuizAttempt>;

export const QuizAttemptResponseAnswer = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('choice'),
      selectedChoiceIds: z.array(z.string().min(1).max(64)).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal('text'),
      text: z.string().min(1).max(20_000),
    })
    .strict(),
  z
    .object({
      kind: z.literal('numeric'),
      value: z.number().finite(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('pairs'),
      pairs: z
        .array(
          z
            .object({
              leftId: z.string().min(1).max(64),
              rightId: z.string().min(1).max(64),
            })
            .strict(),
        )
        .min(1)
        .max(50),
    })
    .strict(),
]);
export type QuizAttemptResponseAnswer = z.infer<typeof QuizAttemptResponseAnswer>;

export const QuizAttemptResponse = z.object({
  id: QuizAttemptResponseId,
  tenantId: TenantId,
  quizId: QuizId,
  attemptId: QuizAttemptId,
  questionId: QuizQuestionId,
  answer: QuizAttemptResponseAnswer,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type QuizAttemptResponse = z.infer<typeof QuizAttemptResponse>;

export const QuizAttemptQuestionGrade = z
  .object({
    id: QuizAttemptQuestionGradeId,
    tenantId: TenantId,
    quizId: QuizId,
    attemptId: QuizAttemptId,
    questionId: QuizQuestionId,
    graderId: UserId,
    score: z.number().int().nonnegative(),
    feedback: z.string().min(1).max(4_000).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type QuizAttemptQuestionGrade = z.infer<typeof QuizAttemptQuestionGrade>;

export const QuizAttemptProbe = z
  .object({
    id: QuizAttemptProbeId,
    tenantId: TenantId,
    quizId: QuizId,
    attemptId: QuizAttemptId,
    learningObjectiveId: LearningObjectiveId,
    sourceQuestionBankQuestionId: QuestionBankQuestionId.nullable(),
    position: z.number().int().nonnegative(),
    difficultyTarget: z.number().min(0).max(1),
    prompt: z.string().min(1),
    renderModel: z.record(z.unknown()),
    points: z.number().int().nonnegative(),
    answerKey: QuizQuestionAnswerKey.nullable(),
    aiGenerationLogId: z.string().min(1).nullable(),
    createdAt: z.date(),
  })
  .strict();
export type QuizAttemptProbe = z.infer<typeof QuizAttemptProbe>;

export const QuizAttemptProbeResponse = z
  .object({
    id: QuizAttemptProbeResponseId,
    tenantId: TenantId,
    quizId: QuizId,
    attemptId: QuizAttemptId,
    probeId: QuizAttemptProbeId,
    answer: QuizAttemptResponseAnswer,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type QuizAttemptProbeResponse = z.infer<typeof QuizAttemptProbeResponse>;
