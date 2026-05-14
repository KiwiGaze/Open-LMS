import { z } from 'zod';
import {
  AssignmentId,
  AssignmentOverrideId,
  AssignmentPeerReviewId,
  CourseGroupSetId,
  CourseId,
  CourseModuleId,
  CourseUnitId,
  RubricId,
  SubmissionId,
  TenantId,
  UserId,
} from './ids.ts';

export const AssignmentStatus = z.enum(['draft', 'published', 'archived']);
export type AssignmentStatus = z.infer<typeof AssignmentStatus>;

export const AssignmentAiSettings = z
  .object({
    precheckEnabled: z.boolean(),
    feedbackDraftEnabled: z.boolean(),
    scoreSuggestionEnabled: z.boolean(),
  })
  .strict();
export type AssignmentAiSettings = z.infer<typeof AssignmentAiSettings>;

export const AssignmentAllowedFileExtension = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, {
    message: 'Allowed file extensions must be lowercase and must not include a leading dot.',
  });
export type AssignmentAllowedFileExtension = z.infer<typeof AssignmentAllowedFileExtension>;

export const Assignment = z
  .object({
    id: AssignmentId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId.nullable().default(null),
    unitId: CourseUnitId.nullable().default(null),
    position: z.number().int().nonnegative().nullable().default(null),
    title: z.string().min(1).max(180),
    instructions: z.string().min(1),
    status: AssignmentStatus,
    dueAt: z.date().nullable(),
    allowResubmission: z.boolean(),
    activeRubricId: RubricId.nullable(),
    aiSettings: AssignmentAiSettings,
    latePenaltyPercentPerDay: z.number().min(0).max(100).nullable().default(null),
    lateMaxPenaltyPercent: z.number().min(0).max(100).nullable().default(null),
    extraCredit: z.boolean().default(false),
    anonymousGradingEnabled: z.boolean().default(false),
    groupSubmissionEnabled: z.boolean().default(false),
    groupSetId: CourseGroupSetId.nullable().default(null),
    allowedFileExtensions: z.array(AssignmentAllowedFileExtension).default([]),
    maxFileSizeBytes: z.number().int().positive().nullable().default(null),
    gradingLocked: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((assignment, context) => {
    if (assignment.unitId !== null && assignment.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit assignments must include their parent module.',
        path: ['moduleId'],
      });
    }
    if (assignment.groupSubmissionEnabled && assignment.groupSetId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Group assignments must include a group set.',
        path: ['groupSetId'],
      });
    }
    if (!assignment.groupSubmissionEnabled && assignment.groupSetId !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Individual assignments cannot include a group set.',
        path: ['groupSetId'],
      });
    }
  });
export type Assignment = z.infer<typeof Assignment>;

export const AssignmentOverrideTargetType = z.enum(['user', 'group', 'section']);
export type AssignmentOverrideTargetType = z.infer<typeof AssignmentOverrideTargetType>;

export const AssignmentOverrideStatus = z.enum(['active', 'archived']);
export type AssignmentOverrideStatus = z.infer<typeof AssignmentOverrideStatus>;

export const AssignmentOverride = z
  .object({
    id: AssignmentOverrideId,
    tenantId: TenantId,
    assignmentId: AssignmentId,
    targetType: AssignmentOverrideTargetType,
    targetId: z.string().min(1),
    opensAt: z.date().nullable(),
    dueAt: z.date().nullable(),
    closesAt: z.date().nullable(),
    status: AssignmentOverrideStatus,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type AssignmentOverride = z.infer<typeof AssignmentOverride>;

export const AssignmentEffectiveSchedule = z
  .object({
    assignmentId: AssignmentId,
    opensAt: z.date().nullable(),
    dueAt: z.date().nullable(),
    closesAt: z.date().nullable(),
  })
  .strict();
export type AssignmentEffectiveSchedule = z.infer<typeof AssignmentEffectiveSchedule>;

export const AssignmentPeerReviewStatus = z.enum([
  'assigned',
  'submitted',
  'completed',
  'cancelled',
]);
export type AssignmentPeerReviewStatus = z.infer<typeof AssignmentPeerReviewStatus>;

export const AssignmentPeerReview = z
  .object({
    id: AssignmentPeerReviewId,
    tenantId: TenantId,
    assignmentId: AssignmentId,
    submissionId: SubmissionId,
    reviewerId: UserId,
    status: AssignmentPeerReviewStatus,
    dueAt: z.date().nullable(),
    submittedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type AssignmentPeerReview = z.infer<typeof AssignmentPeerReview>;
