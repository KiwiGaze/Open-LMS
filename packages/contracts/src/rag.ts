import { z } from 'zod';
import { CourseId, CourseModuleId, CourseUnitId, LearningObjectiveId, TenantId } from './ids.ts';

export const RagSourceType = z.enum([
  'course_page',
  'assignment',
  'rubric',
  'syllabus',
  'teacher_example',
  'reading_material',
  'video_transcript',
  'faq',
  'announcement',
  'scorm_package',
]);
export type RagSourceType = z.infer<typeof RagSourceType>;

export const RagVisibility = z.enum(['student_visible', 'teacher_only']);
export type RagVisibility = z.infer<typeof RagVisibility>;

export const RagAccessPolicy = z.enum(['public', 'course_member', 'course_staff']);
export type RagAccessPolicy = z.infer<typeof RagAccessPolicy>;

export const RagChunkRecord = z
  .object({
    id: z.string().min(1),
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId.nullable(),
    unitId: CourseUnitId.nullable(),
    sourceType: RagSourceType,
    sourceId: z.string().min(1),
    sourceTitle: z.string().min(1),
    chunkIndex: z.number().int().nonnegative(),
    content: z.string().min(1),
    visibility: RagVisibility,
    sourceVersion: z.string().min(1),
    language: z.string().min(2),
    accessPolicy: RagAccessPolicy,
    learningObjectiveIds: z.array(LearningObjectiveId),
    embedding: z.array(z.number()).length(8),
    embeddingModel: z.string().min(1),
    embeddingModelVersion: z.string().min(1),
    chunkingStrategyVersion: z.string().min(1),
    sourceUpdatedAt: z.date(),
    indexedAt: z.date(),
  })
  .strict();
export type RagChunkRecord = z.infer<typeof RagChunkRecord>;
