import { z } from 'zod';
import { CourseCredentialId, CourseId, CredentialAwardId, TenantId, UserId } from './ids.ts';

export const CourseCredentialType = z.enum(['badge', 'certificate']);
export type CourseCredentialType = z.infer<typeof CourseCredentialType>;

export const CourseCredentialStatus = z.enum(['draft', 'published', 'archived']);
export type CourseCredentialStatus = z.infer<typeof CourseCredentialStatus>;

export const CredentialAwardStatus = z.enum(['issued', 'revoked']);
export type CredentialAwardStatus = z.infer<typeof CredentialAwardStatus>;

export const CourseCredential = z.object({
  id: CourseCredentialId,
  tenantId: TenantId,
  courseId: CourseId,
  credentialType: CourseCredentialType,
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(4_000).nullable(),
  criteriaSummary: z.string().min(1).max(4_000),
  status: CourseCredentialStatus,
  imageUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CourseCredential = z.infer<typeof CourseCredential>;

export const CredentialAward = z.object({
  id: CredentialAwardId,
  tenantId: TenantId,
  credentialId: CourseCredentialId,
  studentId: UserId,
  status: CredentialAwardStatus,
  issuedAt: z.date(),
  revokedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CredentialAward = z.infer<typeof CredentialAward>;
