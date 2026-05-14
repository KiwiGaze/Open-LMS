import { z } from 'zod';
import { CourseId, GlossaryEntryId, TenantId } from './ids.ts';

export const GlossaryEntryStatus = z.enum(['draft', 'published', 'archived']);
export type GlossaryEntryStatus = z.infer<typeof GlossaryEntryStatus>;

export const GlossaryEntry = z.object({
  id: GlossaryEntryId,
  tenantId: TenantId,
  courseId: CourseId,
  term: z.string().min(1).max(160),
  definition: z.string().min(1).max(4_000),
  status: GlossaryEntryStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;
