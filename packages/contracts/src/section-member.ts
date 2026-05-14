import { z } from 'zod';
import {
  CourseId,
  CourseSectionId,
  CourseSectionInstructorId,
  CourseSectionMemberId,
  TenantId,
  UserId,
} from './ids.ts';

export const CourseSectionMember = z
  .object({
    id: CourseSectionMemberId,
    tenantId: TenantId,
    courseId: CourseId,
    sectionId: CourseSectionId,
    studentId: UserId,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type CourseSectionMember = z.infer<typeof CourseSectionMember>;

export const CourseSectionInstructor = z
  .object({
    id: CourseSectionInstructorId,
    tenantId: TenantId,
    courseId: CourseId,
    sectionId: CourseSectionId,
    instructorId: UserId,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type CourseSectionInstructor = z.infer<typeof CourseSectionInstructor>;
