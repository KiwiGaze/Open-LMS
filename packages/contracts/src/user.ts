import { z } from 'zod';
import { RetentionPolicyId, TenantId, UserId, UserLegalHoldId } from './ids.ts';

export const Email = z.string().email().max(254);
export type Email = z.infer<typeof Email>;

export const Locale = z.string().min(2).max(35);
export type Locale = z.infer<typeof Locale>;

export const Timezone = z.string().min(1).max(64);
export type Timezone = z.infer<typeof Timezone>;

export const UserStatus = z.enum(['active', 'deleted']);
export type UserStatus = z.infer<typeof UserStatus>;

export const User = z.object({
  id: UserId,
  email: Email,
  displayName: z.string().min(1).max(120),
  emailVerified: z.boolean(),
  status: UserStatus.default('active'),
  deletedAt: z.date().nullable().default(null),
  retainUntil: z.date().nullable().default(null),
  locale: Locale.nullable(),
  timezone: Timezone.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof User>;

export const UserLegalHold = z.object({
  id: UserLegalHoldId,
  tenantId: TenantId,
  userId: UserId,
  createdById: UserId.nullable(),
  reason: z.string().min(1).max(1000),
  releasedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserLegalHold = z.infer<typeof UserLegalHold>;

export const RetentionPolicyTargetType = z.enum(['deleted_user']);
export type RetentionPolicyTargetType = z.infer<typeof RetentionPolicyTargetType>;

export const RetentionPolicy = z.object({
  id: RetentionPolicyId,
  tenantId: TenantId,
  targetType: RetentionPolicyTargetType,
  retainDays: z.number().int().min(0).max(3650),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type RetentionPolicy = z.infer<typeof RetentionPolicy>;
