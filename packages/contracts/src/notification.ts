import { z } from 'zod';
import { NotificationPreferenceId, TenantId, UserId, UserPushTokenId } from './ids.ts';

export const NotificationCategory = z.enum([
  'feedback_published',
  'ai_generation_ready',
  'review_requested',
  'grade_published',
  'announcement_published',
  'discussion_reply',
  'calendar_reminder',
  'system',
]);
export type NotificationCategory = z.infer<typeof NotificationCategory>;

export const NotificationDeliveryState = z.enum(['pending', 'sent', 'failed', 'suppressed']);
export type NotificationDeliveryState = z.infer<typeof NotificationDeliveryState>;

export const NotificationChannel = z.enum(['in_app', 'email', 'push']);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const NotificationFrequency = z.enum(['immediate', 'daily_digest', 'weekly_digest', 'off']);
export type NotificationFrequency = z.infer<typeof NotificationFrequency>;

export const NotificationRecord = z
  .object({
    id: z.string().min(1),
    tenantId: TenantId,
    recipientId: UserId,
    category: NotificationCategory,
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(2000),
    resourceType: z.string().min(1),
    resourceId: z.string().min(1),
    deliveryState: NotificationDeliveryState,
    readAt: z.date().nullable(),
    createdAt: z.date(),
  })
  .strict();
export type NotificationRecord = z.infer<typeof NotificationRecord>;

export const NotificationPreference = z
  .object({
    id: NotificationPreferenceId,
    tenantId: TenantId,
    userId: UserId,
    category: NotificationCategory,
    channel: NotificationChannel,
    frequency: NotificationFrequency,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type NotificationPreference = z.infer<typeof NotificationPreference>;

export const UserPushTokenPlatform = z.enum(['ios', 'android', 'web']);
export type UserPushTokenPlatform = z.infer<typeof UserPushTokenPlatform>;

export const UserPushToken = z
  .object({
    id: UserPushTokenId,
    tenantId: TenantId,
    userId: UserId,
    platform: UserPushTokenPlatform,
    token: z.string().min(1).max(4096),
    locale: z.string().min(2).max(16).nullable(),
    appVersion: z.string().min(1).max(64).nullable(),
    lastUsedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type UserPushToken = z.infer<typeof UserPushToken>;
