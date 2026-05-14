import { z } from 'zod';
import { CourseAnnouncementId, CourseId, TenantId, UserId } from './ids.ts';

export const CourseAnnouncementStatus = z.enum(['draft', 'published', 'archived']);
export type CourseAnnouncementStatus = z.infer<typeof CourseAnnouncementStatus>;

export const CourseAnnouncement = z.object({
  id: CourseAnnouncementId,
  tenantId: TenantId,
  courseId: CourseId,
  authorId: UserId,
  title: z.string().min(1).max(180),
  body: z.string().min(1),
  status: CourseAnnouncementStatus,
  pinned: z.boolean(),
  postedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseAnnouncement = z.infer<typeof CourseAnnouncement>;
