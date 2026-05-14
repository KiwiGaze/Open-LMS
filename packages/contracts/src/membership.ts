import { z } from 'zod';
import { CourseId, CourseMembershipId, MembershipId, TenantId, UserId } from './ids.ts';

export const TenantRole = z.enum([
  'student',
  'instructor',
  'teaching_assistant',
  'course_admin',
  'institution_admin',
  'ai_service_account',
  'integration_service_account',
]);
export type TenantRole = z.infer<typeof TenantRole>;

export const TenantMembership = z.object({
  id: MembershipId,
  tenantId: TenantId,
  userId: UserId,
  role: TenantRole,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TenantMembership = z.infer<typeof TenantMembership>;

export const CourseRole = z.enum(['student', 'instructor', 'teaching_assistant', 'course_admin']);
export type CourseRole = z.infer<typeof CourseRole>;

export const CourseMembershipStatus = z.enum([
  'active',
  'pending_approval',
  'waitlisted',
  'invited',
  'dropped',
  'withdrawn',
]);
export type CourseMembershipStatus = z.infer<typeof CourseMembershipStatus>;

export const CourseMembership = z.object({
  id: CourseMembershipId,
  tenantId: TenantId,
  courseId: CourseId,
  userId: UserId,
  role: CourseRole,
  status: CourseMembershipStatus.default('active'),
  invitedAt: z.date().nullable().default(null),
  acceptedAt: z.date().nullable().default(null),
  droppedAt: z.date().nullable().default(null),
  withdrawnAt: z.date().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseMembership = z.infer<typeof CourseMembership>;

export const RosterImportResultStatus = z.enum(['imported', 'failed']);
export type RosterImportResultStatus = z.infer<typeof RosterImportResultStatus>;

export const RosterImportResult = z
  .object({
    rowNumber: z.number().int().positive(),
    userId: UserId.nullable(),
    status: RosterImportResultStatus,
    membership: CourseMembership.nullable(),
    error: z.string().nullable(),
  })
  .strict();
export type RosterImportResult = z.infer<typeof RosterImportResult>;

export const RosterImportSummary = z
  .object({
    results: z.array(RosterImportResult),
    importedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
  })
  .strict();
export type RosterImportSummary = z.infer<typeof RosterImportSummary>;
