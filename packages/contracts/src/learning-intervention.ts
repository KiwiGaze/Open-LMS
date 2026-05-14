import { z } from 'zod';
import { CourseId, LearningObjectiveId, TenantId, UserId } from './ids.ts';

export const LearningInterventionSubjectType = z.enum(['learner', 'concept', 'cohort']);
export type LearningInterventionSubjectType = z.infer<typeof LearningInterventionSubjectType>;

export const LearningInterventionNeedType = z.enum([
  'misconception',
  'remediation',
  'stretch',
  'check_in',
  'traditional_summary',
]);
export type LearningInterventionNeedType = z.infer<typeof LearningInterventionNeedType>;

export const LearningInterventionStatus = z.enum(['open', 'resolved', 'dismissed']);
export type LearningInterventionStatus = z.infer<typeof LearningInterventionStatus>;

export const LearningInterventionOutcome = z.enum(['worked', 'not_worked', 'unknown']);
export type LearningInterventionOutcome = z.infer<typeof LearningInterventionOutcome>;

export const LearningIntervention = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    subjectType: LearningInterventionSubjectType,
    learnerId: UserId.nullable(),
    objectiveId: LearningObjectiveId.nullable(),
    needType: LearningInterventionNeedType,
    reason: z.string().min(1).max(1_000),
    confidence: z.number().min(0).max(1),
    evidenceCount: z.number().int().nonnegative(),
    recommendedAction: z.string().min(1).max(1_000),
    followUpDueAt: z.date().nullable(),
    status: LearningInterventionStatus,
    outcome: LearningInterventionOutcome.nullable(),
  })
  .strict()
  .superRefine((intervention, context) => {
    if (intervention.subjectType === 'learner' && intervention.learnerId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Learner interventions require learnerId.',
        path: ['learnerId'],
      });
    }
  });
export type LearningIntervention = z.infer<typeof LearningIntervention>;

export const TraditionalAnalyticsFallbackSummary = z
  .object({
    enrolledStudents: z.number().int().nonnegative(),
    totalSubmissions: z.number().int().nonnegative(),
    publishedAssignments: z.number().int().nonnegative(),
    publishedQuizzes: z.number().int().nonnegative(),
  })
  .strict();
export type TraditionalAnalyticsFallbackSummary = z.infer<
  typeof TraditionalAnalyticsFallbackSummary
>;

export const LearningInterventionPlan = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    generatedAt: z.date(),
    sourceMode: z.enum(['evidence', 'traditional_analytics_fallback']),
    interventions: z.array(LearningIntervention),
    fallbackSummary: TraditionalAnalyticsFallbackSummary.nullable(),
  })
  .strict();
export type LearningInterventionPlan = z.infer<typeof LearningInterventionPlan>;

export const TeacherCopilotInsightType = z.enum([
  'traditional_summary',
  'misconception_cluster',
  'cohort_drift',
  'follow_up',
]);
export type TeacherCopilotInsightType = z.infer<typeof TeacherCopilotInsightType>;

export const TeacherCopilotInsight = z
  .object({
    insightType: TeacherCopilotInsightType,
    subject: z.string().min(1).max(180),
    summary: z.string().min(1).max(1_000),
    confidence: z.number().min(0).max(1),
    evidenceCount: z.number().int().nonnegative(),
    learnerIds: z.array(UserId),
    relatedObjectiveId: LearningObjectiveId.nullable(),
    recommendedAction: z.string().min(1).max(1_000),
  })
  .strict();
export type TeacherCopilotInsight = z.infer<typeof TeacherCopilotInsight>;

export const TeacherCopilotBrief = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    generatedAt: z.date(),
    sourceMode: z.enum(['evidence', 'traditional_analytics_fallback']),
    insights: z.array(TeacherCopilotInsight),
    interventionPlan: LearningInterventionPlan,
    fallbackSummary: TraditionalAnalyticsFallbackSummary.nullable(),
  })
  .strict();
export type TeacherCopilotBrief = z.infer<typeof TeacherCopilotBrief>;
