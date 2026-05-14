import { z } from 'zod';
import { CourseId, CourseResourceId, CourseResourceViewEventId, TenantId, UserId } from './ids.ts';

export const CourseResourceViewEvent = z
  .object({
    id: CourseResourceViewEventId,
    tenantId: TenantId,
    courseId: CourseId,
    resourceId: CourseResourceId,
    viewerId: UserId,
    viewedAt: z.date(),
    createdAt: z.date(),
  })
  .strict();
export type CourseResourceViewEvent = z.infer<typeof CourseResourceViewEvent>;
