import { z } from 'zod';
import {
  CompletionProgressId,
  CompletionRequirementId,
  CourseId,
  CourseModuleId,
  TenantId,
  UserId,
} from './ids.ts';

export const CompletionRequirementType = z.enum([
  'view_resource',
  'submit_assignment',
  'pass_quiz',
  'manual',
]);
export type CompletionRequirementType = z.infer<typeof CompletionRequirementType>;

export const CompletionTargetType = z.enum(['course_resource', 'assignment', 'quiz', 'manual']);
export type CompletionTargetType = z.infer<typeof CompletionTargetType>;

export const CompletionRequirementStatus = z.enum(['active', 'archived']);
export type CompletionRequirementStatus = z.infer<typeof CompletionRequirementStatus>;

export const CompletionProgressStatus = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'waived',
]);
export type CompletionProgressStatus = z.infer<typeof CompletionProgressStatus>;

export const CompletionRequirement = z
  .object({
    id: CompletionRequirementId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId.nullable(),
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(4_000).nullable(),
    requirementType: CompletionRequirementType,
    targetType: CompletionTargetType,
    targetId: z.string().min(1).max(128).nullable(),
    minScorePercent: z.number().min(0).max(100).nullable(),
    status: CompletionRequirementStatus,
    required: z.boolean(),
    position: z.number().int().nonnegative(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((requirement, context) => {
    if (requirement.requirementType === 'manual') {
      if (requirement.targetType !== 'manual') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Manual completion requirements must use the manual target type.',
          path: ['targetType'],
        });
      }

      if (requirement.targetId !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Manual completion requirements cannot target a resource.',
          path: ['targetId'],
        });
      }
    }

    if (requirement.requirementType === 'pass_quiz') {
      if (requirement.targetType !== 'quiz') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pass quiz completion requirements must target a quiz.',
          path: ['targetType'],
        });
      }

      if (requirement.targetId === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pass quiz completion requirements must include a quiz target.',
          path: ['targetId'],
        });
      }
    } else if (requirement.minScorePercent !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum score thresholds are only valid for pass quiz requirements.',
        path: ['minScorePercent'],
      });
    }
  });
export type CompletionRequirement = z.infer<typeof CompletionRequirement>;

export const CompletionProgress = z.object({
  id: CompletionProgressId,
  tenantId: TenantId,
  requirementId: CompletionRequirementId,
  studentId: UserId,
  status: CompletionProgressStatus,
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CompletionProgress = z.infer<typeof CompletionProgress>;
