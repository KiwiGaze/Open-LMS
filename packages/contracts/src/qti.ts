import { z } from 'zod';
import { QuizQuestion } from './quiz.ts';

export const QtiFormat = z.enum(['qti_2_1']);
export type QtiFormat = z.infer<typeof QtiFormat>;

export const QtiAssessmentItemExport = z
  .object({
    identifier: z.string().min(1).max(180),
    title: z.string().min(1).max(180),
    xml: z.string().min(1).max(250_000),
  })
  .strict();
export type QtiAssessmentItemExport = z.infer<typeof QtiAssessmentItemExport>;

export const QtiQuizItemExport = z
  .object({
    format: QtiFormat,
    exportedAt: z.date(),
    itemCount: z.number().int().nonnegative(),
    items: z.array(QtiAssessmentItemExport).max(500),
  })
  .strict()
  .superRefine((exportBundle, context) => {
    if (exportBundle.itemCount !== exportBundle.items.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'QTI export itemCount must match the number of exported items.',
        path: ['itemCount'],
      });
    }
  });
export type QtiQuizItemExport = z.infer<typeof QtiQuizItemExport>;

export const QtiAssessmentItemImport = z
  .object({
    xml: z.string().min(1).max(250_000),
  })
  .strict();
export type QtiAssessmentItemImport = z.infer<typeof QtiAssessmentItemImport>;

export const QtiQuizItemImportRequest = z
  .object({
    format: QtiFormat,
    startingPosition: z.number().int().nonnegative().optional(),
    items: z.array(QtiAssessmentItemImport).min(1).max(500),
  })
  .strict();
export type QtiQuizItemImportRequest = z.infer<typeof QtiQuizItemImportRequest>;

export const QtiQuizItemImportResult = z
  .object({
    format: QtiFormat,
    importedCount: z.number().int().nonnegative(),
    questions: z.array(QuizQuestion).max(500),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.importedCount !== result.questions.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'QTI import importedCount must match the number of imported questions.',
        path: ['importedCount'],
      });
    }
  });
export type QtiQuizItemImportResult = z.infer<typeof QtiQuizItemImportResult>;
