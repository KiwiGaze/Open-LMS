import { z } from 'zod';
import { CourseId, CourseModuleId, LearningObjectiveId, TenantId, UserId } from './ids.ts';

export const LearnerPathMode = z.enum(['adaptive', 'traditional']);
export type LearnerPathMode = z.infer<typeof LearnerPathMode>;

export const LearnerObjectiveReadiness = z.enum(['blocked', 'remediate', 'ready', 'stretch']);
export type LearnerObjectiveReadiness = z.infer<typeof LearnerObjectiveReadiness>;

export const LearningPathResourceType = z.enum([
  'course_module',
  'course_unit',
  'course_page',
  'course_resource',
  'assignment',
  'quiz',
  'discussion_topic',
]);
export type LearningPathResourceType = z.infer<typeof LearningPathResourceType>;

export const LearningPathActivityType = z.enum(['resource', 'practice', 'assessment', 'support']);
export type LearningPathActivityType = z.infer<typeof LearningPathActivityType>;

export const LearnerObjectiveState = z
  .object({
    objectiveId: LearningObjectiveId,
    masteryStatus: z.enum(['not_assessed', 'developing', 'proficient', 'mastered']),
    readiness: LearnerObjectiveReadiness,
    confidence: z.number().min(0).max(1),
    evidenceCount: z.number().int().nonnegative(),
    misconceptionIds: z.array(z.string().min(1)).max(20),
    lastEvidenceAt: z.date().nullable(),
  })
  .strict();
export type LearnerObjectiveState = z.infer<typeof LearnerObjectiveState>;

export const LearningPathResourceRef = z
  .object({
    resourceType: LearningPathResourceType,
    resourceId: z.string().min(1),
    title: z.string().min(1).max(180),
    moduleId: CourseModuleId.nullable(),
    position: z.number().int().nonnegative().nullable(),
  })
  .strict();
export type LearningPathResourceRef = z.infer<typeof LearningPathResourceRef>;

export const LearningPathActivity = z
  .object({
    activityType: LearningPathActivityType,
    title: z.string().min(1).max(180),
    objectiveIds: z.array(LearningObjectiveId),
    resource: LearningPathResourceRef.nullable(),
    priority: z.number().int().min(0).max(100),
    required: z.boolean(),
    rationale: z.string().min(1).max(1_000),
    estimatedMinutes: z.number().int().positive().nullable().default(null),
    selectionSignals: z.array(z.string().min(1).max(80)).default([]),
  })
  .strict();
export type LearningPathActivity = z.infer<typeof LearningPathActivity>;

export const LearnerLearningPath = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    studentId: UserId,
    mode: LearnerPathMode,
    generatedAt: z.date(),
    objectiveStates: z.array(LearnerObjectiveState),
    activities: z.array(LearningPathActivity),
    fallbackReason: z.string().min(1).max(500).nullable(),
  })
  .strict();
export type LearnerLearningPath = z.infer<typeof LearnerLearningPath>;
