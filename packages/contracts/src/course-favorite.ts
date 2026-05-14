import { z } from 'zod';
import { CourseFavoriteId, CourseId, TenantId, UserId } from './ids.ts';

export const CourseFavorite = z.object({
  id: CourseFavoriteId,
  tenantId: TenantId,
  courseId: CourseId,
  userId: UserId,
  createdAt: z.date(),
});
export type CourseFavorite = z.infer<typeof CourseFavorite>;
