import { z } from 'zod';
import {
  CourseGroupId,
  CourseGroupMemberId,
  CourseGroupSetId,
  CourseId,
  TenantId,
  UserId,
} from './ids.ts';

export const CourseGroupSetStatus = z.enum(['active', 'archived']);
export type CourseGroupSetStatus = z.infer<typeof CourseGroupSetStatus>;

export const CourseGroupSet = z.object({
  id: CourseGroupSetId,
  tenantId: TenantId,
  courseId: CourseId,
  name: z.string().min(1).max(120),
  selfSignupEnabled: z.boolean(),
  status: CourseGroupSetStatus,
  position: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseGroupSet = z.infer<typeof CourseGroupSet>;

export const CourseGroupStatus = z.enum(['active', 'archived']);
export type CourseGroupStatus = z.infer<typeof CourseGroupStatus>;

export const CourseGroup = z.object({
  id: CourseGroupId,
  tenantId: TenantId,
  courseId: CourseId,
  groupSetId: CourseGroupSetId,
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2_000).nullable(),
  status: CourseGroupStatus,
  position: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseGroup = z.infer<typeof CourseGroup>;

export const CourseGroupMemberRole = z.enum(['member', 'leader']);
export type CourseGroupMemberRole = z.infer<typeof CourseGroupMemberRole>;

export const CourseGroupMember = z.object({
  id: CourseGroupMemberId,
  tenantId: TenantId,
  groupId: CourseGroupId,
  userId: UserId,
  role: CourseGroupMemberRole,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseGroupMember = z.infer<typeof CourseGroupMember>;
