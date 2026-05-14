import { z } from 'zod';
import {
  CourseId,
  LearningObjectiveId,
  TenantId,
  UserId,
  WikiPageId,
  WikiPageRevisionId,
} from './ids.ts';

export const WikiPageStatus = z.enum(['draft', 'published', 'archived']);
export type WikiPageStatus = z.infer<typeof WikiPageStatus>;

export const WikiPage = z.object({
  id: WikiPageId,
  tenantId: TenantId,
  courseId: CourseId,
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Slug must be lowercase letters, digits, and dashes.'),
  title: z.string().min(1).max(180),
  content: z.string().min(1).max(50_000),
  status: WikiPageStatus,
  learningObjectiveIds: z.array(LearningObjectiveId).default([]),
  createdById: UserId,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type WikiPage = z.infer<typeof WikiPage>;

export const WikiPageRevision = z.object({
  id: WikiPageRevisionId,
  tenantId: TenantId,
  wikiPageId: WikiPageId,
  revision: z.number().int().positive(),
  authorId: UserId,
  title: z.string().min(1).max(180),
  content: z.string().min(1).max(50_000),
  learningObjectiveIds: z.array(LearningObjectiveId).default([]),
  summary: z.string().min(1).max(500).nullable(),
  createdAt: z.date(),
});
export type WikiPageRevision = z.infer<typeof WikiPageRevision>;

export const WikiPageRevisionDiffLine = z.object({
  kind: z.enum(['unchanged', 'added', 'removed']),
  oldLineNumber: z.number().int().positive().nullable(),
  newLineNumber: z.number().int().positive().nullable(),
  text: z.string(),
});
export type WikiPageRevisionDiffLine = z.infer<typeof WikiPageRevisionDiffLine>;

export const WikiPageRevisionDiff = z.object({
  wikiPageId: WikiPageId,
  baseRevision: z.number().int().positive(),
  targetRevision: z.number().int().positive(),
  title: z.object({
    changed: z.boolean(),
    base: z.string().min(1).max(180),
    target: z.string().min(1).max(180),
  }),
  learningObjectiveIds: z.object({
    added: z.array(LearningObjectiveId),
    removed: z.array(LearningObjectiveId),
  }),
  content: z.array(WikiPageRevisionDiffLine),
});
export type WikiPageRevisionDiff = z.infer<typeof WikiPageRevisionDiff>;
