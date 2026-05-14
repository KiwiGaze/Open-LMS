import { z } from 'zod';
import { GradeStatus, PublishedFeedbackSource } from './feedback.ts';
import {
  AssignmentId,
  CourseId,
  ExportJobId,
  FileResourceId,
  SubmissionId,
  TenantId,
  UserId,
} from './ids.ts';

export const ExportType = z.enum(['feedback', 'grades', 'feedback_and_grades']);
export type ExportType = z.infer<typeof ExportType>;

export const ExportFormat = z.enum(['csv', 'json']);
export type ExportFormat = z.infer<typeof ExportFormat>;

export const ExportStatus = z.enum(['queued', 'running', 'succeeded', 'failed']);
export type ExportStatus = z.infer<typeof ExportStatus>;

export const ExportFilters = z
  .object({
    courseId: CourseId.nullable(),
    assignmentId: AssignmentId.nullable(),
    studentId: UserId.nullable(),
    submittedFrom: z.date().nullable(),
    submittedTo: z.date().nullable(),
  })
  .strict();
export type ExportFilters = z.infer<typeof ExportFilters>;

export const ExportJobRecord = z
  .object({
    id: ExportJobId,
    tenantId: TenantId,
    requestedById: UserId,
    exportType: ExportType,
    format: ExportFormat,
    status: ExportStatus,
    filters: ExportFilters,
    storageFileId: FileResourceId.nullable(),
    errorMessage: z.string().min(1).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ExportJobRecord = z.infer<typeof ExportJobRecord>;

export const FeedbackGradeExportRow = z
  .object({
    assignmentId: AssignmentId,
    submissionId: SubmissionId,
    studentId: UserId,
    score: z.number().nonnegative().nullable(),
    maxScore: z.number().positive().nullable(),
    gradeStatus: GradeStatus.nullable(),
    feedbackVersion: z.number().int().positive().nullable(),
    feedbackSource: PublishedFeedbackSource.nullable(),
    overallComment: z.string().nullable(),
    publishedAt: z.date().nullable(),
  })
  .strict();
export type FeedbackGradeExportRow = z.infer<typeof FeedbackGradeExportRow>;
