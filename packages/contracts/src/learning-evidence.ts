import { z } from 'zod';
import { CourseId, LearningEvidenceId, LearningObjectiveId, TenantId, UserId } from './ids.ts';

export const LearningEvidenceSourceType = z.enum([
  'assignment_submission',
  'quiz_attempt',
  'discussion_post',
  'support_conversation',
  'instructor_observation',
]);
export type LearningEvidenceSourceType = z.infer<typeof LearningEvidenceSourceType>;

export const LearningEvidenceSignal = z.enum([
  'attempt',
  'revision',
  'misconception',
  'explanation',
  'mastery_observation',
]);
export type LearningEvidenceSignal = z.infer<typeof LearningEvidenceSignal>;

export const LearningEvidenceSource = z
  .object({
    sourceType: LearningEvidenceSourceType,
    sourceId: z.string().min(1),
    attempt: z.number().int().positive().nullable(),
    observedAt: z.date(),
  })
  .strict();
export type LearningEvidenceSource = z.infer<typeof LearningEvidenceSource>;

export const LearningEvidenceProvenance = z
  .object({
    observedByUserId: UserId.nullable(),
    extractionModel: z.string().min(1).max(120).nullable(),
    extractionPromptIdentifier: z.string().min(1).max(180).nullable(),
  })
  .strict();
export type LearningEvidenceProvenance = z.infer<typeof LearningEvidenceProvenance>;

export const LearningEvidenceContext = z
  .object({
    citedResourceIds: z.array(z.string().min(1)).max(100),
    supportThreadId: z.string().min(1).nullable(),
    modelReadableSummary: z.string().min(1).max(2_000).nullable(),
  })
  .strict();
export type LearningEvidenceContext = z.infer<typeof LearningEvidenceContext>;

export const LearningEvidence = z
  .object({
    id: LearningEvidenceId,
    tenantId: TenantId,
    courseId: CourseId,
    studentId: UserId,
    objectiveId: LearningObjectiveId,
    source: LearningEvidenceSource,
    signal: LearningEvidenceSignal,
    score: z.number().finite().nonnegative().nullable(),
    maxScore: z.number().finite().positive().nullable(),
    confidence: z.number().min(0).max(1),
    misconceptionIds: z.array(z.string().min(1)).max(50),
    evidenceText: z.string().min(1).max(10_000),
    provenance: LearningEvidenceProvenance.default({
      observedByUserId: null,
      extractionModel: null,
      extractionPromptIdentifier: null,
    }),
    context: LearningEvidenceContext.default({
      citedResourceIds: [],
      supportThreadId: null,
      modelReadableSummary: null,
    }),
    createdAt: z.date(),
  })
  .strict()
  .superRefine((evidence, context) => {
    const hasScore = evidence.score !== null;
    const hasMaxScore = evidence.maxScore !== null;
    if (hasScore !== hasMaxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Learning evidence score and max score must both be set or both be null.',
        path: hasScore ? ['maxScore'] : ['score'],
      });
      return;
    }
    if (
      evidence.score !== null &&
      evidence.maxScore !== null &&
      evidence.score > evidence.maxScore
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Learning evidence score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type LearningEvidence = z.infer<typeof LearningEvidence>;

export const ObjectiveEvidenceSummary = z
  .object({
    objectiveId: LearningObjectiveId,
    evidenceCount: z.number().int().nonnegative(),
    averageScorePercent: z.number().min(0).max(100).nullable(),
    confidence: z.number().min(0).max(1),
    growthTrend: z.enum(['improving', 'stable', 'declining', 'insufficient_evidence']),
    unresolvedMisconceptionIds: z.array(z.string().min(1)),
    lastObservedAt: z.date().nullable(),
  })
  .strict();
export type ObjectiveEvidenceSummary = z.infer<typeof ObjectiveEvidenceSummary>;

export const ProjectedGrade = z
  .object({
    score: z.number().finite().nonnegative(),
    maxScore: z.number().finite().positive(),
    source: z.enum(['learning_evidence', 'traditional_gradebook']),
  })
  .strict()
  .superRefine((grade, context) => {
    if (grade.score > grade.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Projected grade score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type ProjectedGrade = z.infer<typeof ProjectedGrade>;

export const LearningEvidenceProjection = z
  .object({
    tenantId: TenantId,
    courseId: CourseId,
    studentId: UserId,
    generatedAt: z.date(),
    sourceMode: z.enum(['evidence', 'traditional_grade_fallback']),
    objectiveSummaries: z.array(ObjectiveEvidenceSummary),
    projectedGrade: ProjectedGrade.nullable(),
  })
  .strict();
export type LearningEvidenceProjection = z.infer<typeof LearningEvidenceProjection>;
