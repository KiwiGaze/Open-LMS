import { z } from 'zod';
import { LearningObjectiveId, RubricId, RubricTemplateId, TenantId } from './ids.ts';

export const RubricLevel = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1).max(80),
    description: z.string().min(1),
    points: z.number().nonnegative(),
  })
  .strict();
export type RubricLevel = z.infer<typeof RubricLevel>;

export const RubricCriterion = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1).max(120),
    description: z.string().min(1),
    evidenceRequired: z.boolean(),
    learningObjectiveIds: z.array(LearningObjectiveId).default([]),
    levels: z.array(RubricLevel).min(1),
  })
  .strict();
export type RubricCriterion = z.infer<typeof RubricCriterion>;

export const RubricOwner = z.enum(['community', 'editorial', 'institution']);
export type RubricOwner = z.infer<typeof RubricOwner>;

export const Rubric = z.object({
  id: RubricId,
  tenantId: TenantId,
  title: z.string().min(1).max(160),
  version: z.number().int().positive(),
  sourceTemplateId: RubricTemplateId.nullable(),
  criteria: z.array(RubricCriterion).min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Rubric = z.infer<typeof Rubric>;

export const RubricTemplate = z.object({
  id: RubricTemplateId,
  version: z.number().int().positive(),
  owner: RubricOwner,
  title: z.string().min(1).max(160),
  disciplineTags: z.array(z.string().min(1)),
  assignmentTypeTags: z.array(z.string().min(1)),
  localeTags: z.array(z.string().min(1)),
  criteria: z.array(RubricCriterion).min(1),
  qualityScore: z.number().min(0).max(1),
  exampleFeedbackFragments: z.array(z.string().min(1)),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type RubricTemplate = z.infer<typeof RubricTemplate>;
