import { z } from 'zod';
import {
  CourseId,
  LearningObjectiveId,
  ScormAttemptId,
  ScormExtractedContentId,
  ScormPackageId,
  TenantId,
  UserId,
} from './ids.ts';

export const ScormVersion = z.enum(['1.2', '2004']);
export type ScormVersion = z.infer<typeof ScormVersion>;

export const ScormPackageStatus = z.enum(['draft', 'published', 'archived']);
export type ScormPackageStatus = z.infer<typeof ScormPackageStatus>;

const HttpsLaunchUrl = z
  .string()
  .min(1)
  .max(2048)
  .url()
  .refine((value) => value.toLowerCase().startsWith('https://'), {
    message: 'SCORM launch URL must be https.',
  });

export const ScormPackage = z
  .object({
    id: ScormPackageId,
    tenantId: TenantId,
    courseId: CourseId,
    title: z.string().min(1).max(180),
    scormVersion: ScormVersion,
    launchUrl: HttpsLaunchUrl,
    manifest: z.record(z.unknown()),
    status: ScormPackageStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ScormPackage = z.infer<typeof ScormPackage>;

export const ScormExtractedContent = z
  .object({
    id: ScormExtractedContentId,
    tenantId: TenantId,
    courseId: CourseId,
    scormPackageId: ScormPackageId,
    sourceKey: z.string().min(1).max(300),
    title: z.string().min(1).max(180),
    body: z.string().min(1),
    language: z.string().min(2).default('en'),
    learningObjectiveIds: z.array(LearningObjectiveId).default([]),
    sourceVersion: z.string().min(1).max(120),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ScormExtractedContent = z.infer<typeof ScormExtractedContent>;

export const ScormCompletionStatus = z.enum(['not_attempted', 'incomplete', 'completed']);
export type ScormCompletionStatus = z.infer<typeof ScormCompletionStatus>;

export const ScormSuccessStatus = z.enum(['unknown', 'passed', 'failed']);
export type ScormSuccessStatus = z.infer<typeof ScormSuccessStatus>;

export const ScormAttempt = z
  .object({
    id: ScormAttemptId,
    tenantId: TenantId,
    scormPackageId: ScormPackageId,
    studentId: UserId,
    completionStatus: ScormCompletionStatus,
    successStatus: ScormSuccessStatus,
    scoreScaled: z.number().finite().min(0).max(1).nullable(),
    totalTimeSeconds: z.number().finite().nonnegative().nullable(),
    suspendData: z.string().max(64_000).nullable(),
    lastVisitedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ScormAttempt = z.infer<typeof ScormAttempt>;

export const ScormRuntimeElement = z.enum([
  'cmi.core.entry',
  'cmi.core.lesson_status',
  'cmi.core.score.raw',
  'cmi.core.session_time',
  'cmi.core.total_time',
  'cmi.completion_status',
  'cmi.entry',
  'cmi.score.scaled',
  'cmi.session_time',
  'cmi.success_status',
  'cmi.suspend_data',
  'cmi.total_time',
]);
export type ScormRuntimeElement = z.infer<typeof ScormRuntimeElement>;

export const ScormRuntimeValueMap = z.record(ScormRuntimeElement, z.string().max(64_000));
export type ScormRuntimeValueMap = z.infer<typeof ScormRuntimeValueMap>;

export const ScormRuntimeCommit = z
  .object({
    values: ScormRuntimeValueMap,
  })
  .strict();
export type ScormRuntimeCommit = z.infer<typeof ScormRuntimeCommit>;

export const ScormRuntimeState = z
  .object({
    attempt: ScormAttempt,
    values: ScormRuntimeValueMap,
  })
  .strict();
export type ScormRuntimeState = z.infer<typeof ScormRuntimeState>;
