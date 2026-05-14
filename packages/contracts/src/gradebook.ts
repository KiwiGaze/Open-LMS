import { z } from 'zod';
import { GradeSource, GradeStatus } from './feedback.ts';
import {
  AssignmentId,
  CourseGradingSchemeId,
  CourseId,
  FileResourceId,
  GradeAppealId,
  GradeHistoryId,
  GradeId,
  GradebookCategoryId,
  GradebookManualGradeId,
  GradebookManualItemId,
  IntegrationConnectionId,
  SubmissionId,
  TenantId,
  UserId,
} from './ids.ts';

export const GradebookCategoryStatus = z.enum(['active', 'archived']);
export type GradebookCategoryStatus = z.infer<typeof GradebookCategoryStatus>;

export const GradebookManualItemStatus = z.enum(['active', 'archived']);
export type GradebookManualItemStatus = z.infer<typeof GradebookManualItemStatus>;

export const GradebookCategory = z
  .object({
    id: GradebookCategoryId,
    tenantId: TenantId,
    courseId: CourseId,
    name: z.string().min(1).max(180),
    position: z.number().int().nonnegative(),
    weightPercent: z.number().nonnegative().max(100).nullable(),
    dropLowest: z.number().int().nonnegative(),
    status: GradebookCategoryStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type GradebookCategory = z.infer<typeof GradebookCategory>;

export const GradebookManualItem = z
  .object({
    id: GradebookManualItemId,
    tenantId: TenantId,
    courseId: CourseId,
    gradebookCategoryId: GradebookCategoryId.nullable(),
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(2000).nullable(),
    maxScore: z.number().finite().positive(),
    dueAt: z.date().nullable(),
    position: z.number().int().nonnegative(),
    status: GradebookManualItemStatus,
    extraCredit: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type GradebookManualItem = z.infer<typeof GradebookManualItem>;

export const GradebookManualGrade = z
  .object({
    id: GradebookManualGradeId,
    tenantId: TenantId,
    gradebookManualItemId: GradebookManualItemId,
    studentId: UserId,
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().positive(),
    status: GradeStatus,
    source: GradeSource,
    gradedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((grade, context) => {
    if (grade.score > grade.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual gradebook grade score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type GradebookManualGrade = z.infer<typeof GradebookManualGrade>;

export const CourseGradingSchemeStatus = z.enum(['active', 'archived']);
export type CourseGradingSchemeStatus = z.infer<typeof CourseGradingSchemeStatus>;

export const CourseGradingSchemeEntry = z
  .object({
    label: z.string().min(1).max(32),
    minPercent: z.number().min(0).max(100),
  })
  .strict();
export type CourseGradingSchemeEntry = z.infer<typeof CourseGradingSchemeEntry>;

export const CourseGradingScheme = z
  .object({
    id: CourseGradingSchemeId,
    tenantId: TenantId,
    courseId: CourseId,
    name: z.string().min(1).max(180),
    status: CourseGradingSchemeStatus,
    entries: z.array(CourseGradingSchemeEntry).min(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((scheme, context) => {
    const labels = new Set<string>();

    for (const [index, entry] of scheme.entries.entries()) {
      if (labels.has(entry.label)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Grading scheme labels must be unique.',
          path: ['entries', index, 'label'],
        });
      }
      labels.add(entry.label);

      const previousEntry = index > 0 ? scheme.entries[index - 1] : undefined;
      if (previousEntry && entry.minPercent >= previousEntry.minPercent) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Grading scheme thresholds must be ordered from highest to lowest.',
          path: ['entries', index, 'minPercent'],
        });
      }
    }

    if (scheme.entries.at(-1)?.minPercent !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Grading schemes must include a 0 percent threshold.',
        path: ['entries'],
      });
    }
  });
export type CourseGradingScheme = z.infer<typeof CourseGradingScheme>;

export const DiscussionGradebookEntry = z
  .object({
    id: z.string().min(1),
    tenantId: TenantId,
    courseId: CourseId,
    topicId: z.string().min(1),
    topicTitle: z.string().min(1).max(180),
    postId: z.string().min(1),
    gradeId: z.string().min(1),
    studentId: UserId,
    score: z.number().nonnegative(),
    maxScore: z.number().positive(),
    status: z.enum(['draft', 'published', 'revised']),
    comment: z.string().min(1).max(4_000).nullable(),
    gradedAt: z.date(),
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.score > entry.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discussion gradebook entry score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type DiscussionGradebookEntry = z.infer<typeof DiscussionGradebookEntry>;

export const GradebookEntry = z
  .object({
    id: z.string().min(1),
    tenantId: TenantId,
    courseId: CourseId,
    assignmentId: AssignmentId,
    assignmentTitle: z.string().min(1).max(180),
    assignmentDueAt: z.date().nullable(),
    assignmentExtraCredit: z.boolean().default(false),
    gradebookCategoryId: GradebookCategoryId.nullable(),
    gradebookCategoryName: z.string().min(1).max(180).nullable(),
    studentId: UserId,
    submissionId: SubmissionId,
    submittedAt: z.date(),
    gradeId: GradeId,
    score: z.number().nonnegative(),
    maxScore: z.number().positive(),
    gradeStatus: GradeStatus,
    gradeSource: GradeSource,
    gradedAt: z.date(),
  })
  .strict()
  .superRefine((entry, context) => {
    const hasCategoryId = entry.gradebookCategoryId !== null;
    const hasCategoryName = entry.gradebookCategoryName !== null;

    if (hasCategoryId !== hasCategoryName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gradebook category id and name must both be set or both be null.',
        path: hasCategoryId ? ['gradebookCategoryName'] : ['gradebookCategoryId'],
      });
    }
  });
export type GradebookEntry = z.infer<typeof GradebookEntry>;

export const GradebookCategoryRollup = z
  .object({
    categoryId: GradebookCategoryId.nullable(),
    categoryName: z.string().min(1).max(180).nullable(),
    weightPercent: z.number().nonnegative().max(100).nullable(),
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().nonnegative(),
    percent: z.number().finite().nonnegative(),
    droppedItemIds: z.array(z.string().min(1)),
  })
  .strict();
export type GradebookCategoryRollup = z.infer<typeof GradebookCategoryRollup>;

export const CourseFinalGrade = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    studentId: UserId,
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().positive(),
    percent: z.number().finite().nonnegative(),
    letterGrade: z.string().min(1).max(32).nullable(),
    categoryRollups: z.array(GradebookCategoryRollup),
    computedAt: z.date(),
  })
  .strict();
export type CourseFinalGrade = z.infer<typeof CourseFinalGrade>;

export const SisFinalGradeSubmission = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    integrationConnectionId: IntegrationConnectionId,
    storageFileId: FileResourceId,
    rowCount: z.number().int().nonnegative(),
    status: z.literal('queued'),
    submittedAt: z.date(),
  })
  .strict();
export type SisFinalGradeSubmission = z.infer<typeof SisFinalGradeSubmission>;

export const GradeHistory = z
  .object({
    id: GradeHistoryId,
    tenantId: TenantId,
    gradeId: GradeId,
    submissionId: SubmissionId,
    actorId: UserId.nullable(),
    previousScore: z.number().finite().nonnegative().nullable(),
    previousMaxScore: z.number().finite().positive().nullable(),
    previousStatus: GradeStatus.nullable(),
    previousSource: GradeSource.nullable(),
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().positive(),
    status: GradeStatus,
    source: GradeSource,
    reason: z.string().min(1).max(2000).nullable(),
    createdAt: z.date(),
  })
  .strict()
  .superRefine((history, context) => {
    const previousScoreSet = history.previousScore !== null;
    const previousMaxScoreSet = history.previousMaxScore !== null;
    const previousStatusSet = history.previousStatus !== null;
    const previousSourceSet = history.previousSource !== null;

    if (
      !(
        previousScoreSet === previousMaxScoreSet &&
        previousScoreSet === previousStatusSet &&
        previousScoreSet === previousSourceSet
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Previous grade fields must either all be set or all be null.',
        path: ['previousScore'],
      });
    }

    if (history.previousScore !== null && history.previousMaxScore !== null) {
      if (history.previousScore > history.previousMaxScore) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Previous grade score cannot exceed previous max score.',
          path: ['previousScore'],
        });
      }
    }

    if (history.score > history.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Grade history score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type GradeHistory = z.infer<typeof GradeHistory>;

export const GradeAppealStatus = z.enum([
  'open',
  'under_review',
  'resolved',
  'rejected',
  'cancelled',
]);
export type GradeAppealStatus = z.infer<typeof GradeAppealStatus>;

export const GradeAppeal = z
  .object({
    id: GradeAppealId,
    tenantId: TenantId,
    gradeId: GradeId,
    submissionId: SubmissionId,
    studentId: UserId,
    status: GradeAppealStatus,
    reason: z.string().min(1).max(4000),
    resolution: z.string().min(1).max(4000).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    resolvedAt: z.date().nullable(),
  })
  .strict()
  .superRefine((appeal, context) => {
    const terminal = appeal.status === 'resolved' || appeal.status === 'rejected';
    if (terminal && appeal.resolution === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Resolved and rejected grade appeals require a resolution.',
        path: ['resolution'],
      });
    }

    if (!terminal && appeal.resolvedAt !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only resolved or rejected grade appeals can have a resolvedAt timestamp.',
        path: ['resolvedAt'],
      });
    }
  });
export type GradeAppeal = z.infer<typeof GradeAppeal>;
