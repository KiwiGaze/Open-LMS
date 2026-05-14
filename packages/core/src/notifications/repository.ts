import {
  type NotificationCategory,
  type NotificationChannel,
  type NotificationFrequency,
  NotificationPreference,
  type NotificationPreference as NotificationPreferenceContract,
  NotificationPreferenceId,
  NotificationRecord,
  type NotificationRecord as NotificationRecordContract,
  OutboxEvent,
  type OutboxEvent as OutboxEventContract,
  TenantId,
  UserId,
  UserPushToken,
  type UserPushToken as UserPushTokenContract,
  UserPushTokenId,
  type UserPushTokenPlatform,
} from '@openlms/contracts';
import { and, asc, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseTransaction } from '../db/client.ts';
import { outboxEvent } from '../db/schema/audit.ts';
import {
  notification,
  notificationDigestDelivery,
  notificationPreference,
  userPushToken,
} from '../db/schema/notification.ts';

export const saveNotification = async (
  db: Database,
  value: NotificationRecordContract,
): Promise<NotificationRecordContract> => {
  const parsed = NotificationRecord.parse(value);
  const [row] = await db.insert(notification).values(parsed).returning();

  if (!row) {
    throw new Error('Notification could not be saved because the database returned no row.');
  }

  return NotificationRecord.parse(row);
};

export type SaveProducedNotificationInput = {
  notification: NotificationRecordContract | null;
  deliveryEvents: OutboxEventContract[];
};

const saveProducedNotificationWithExecutor = async (
  db: DatabaseTransaction,
  input: SaveProducedNotificationInput,
): Promise<SaveProducedNotificationInput> => {
  const savedNotification = input.notification
    ? await (async (): Promise<NotificationRecordContract> => {
        const parsed = NotificationRecord.parse(input.notification);
        const [row] = await db.insert(notification).values(parsed).returning();

        if (!row) {
          throw new Error('Notification could not be saved because the database returned no row.');
        }

        return NotificationRecord.parse(row);
      })()
    : null;

  const savedDeliveryEvents: OutboxEventContract[] = [];
  for (const event of input.deliveryEvents) {
    const parsed = OutboxEvent.parse(event);
    const [row] = await db.insert(outboxEvent).values(parsed).returning();

    if (!row) {
      throw new Error(
        'Notification delivery event could not be saved because the database returned no row.',
      );
    }

    savedDeliveryEvents.push(OutboxEvent.parse(row));
  }

  return {
    notification: savedNotification,
    deliveryEvents: savedDeliveryEvents,
  };
};

export const saveProducedNotification = async (
  db: Database,
  input: SaveProducedNotificationInput,
): Promise<SaveProducedNotificationInput> =>
  db.transaction((tx) => saveProducedNotificationWithExecutor(tx, input));

export const saveProducedNotifications = async (
  db: Database,
  inputs: SaveProducedNotificationInput[],
): Promise<SaveProducedNotificationInput[]> =>
  db.transaction(async (tx) => {
    const outputs: SaveProducedNotificationInput[] = [];

    for (const input of inputs) {
      outputs.push(await saveProducedNotificationWithExecutor(tx, input));
    }

    return outputs;
  });

export const listNotificationsForRecipient = async (
  db: Database,
  tenantId: string,
  recipientId: string,
): Promise<NotificationRecordContract[]> => {
  const rows = await db
    .select()
    .from(notification)
    .where(and(eq(notification.tenantId, tenantId), eq(notification.recipientId, recipientId)))
    .orderBy(desc(notification.createdAt));

  return rows.map((row) => NotificationRecord.parse(row));
};

export type NotificationDigestFrequency = Extract<
  NotificationFrequency,
  'daily_digest' | 'weekly_digest'
>;

export type ListPendingEmailDigestNotificationsInput = {
  tenantId: string;
  frequency: NotificationDigestFrequency;
  windowStart: Date;
  windowEnd: Date;
  limit: number;
};

export const listPendingEmailDigestNotifications = async (
  db: Database,
  input: ListPendingEmailDigestNotificationsInput,
): Promise<NotificationRecordContract[]> => {
  const rows = await db
    .select({
      id: notification.id,
      tenantId: notification.tenantId,
      recipientId: notification.recipientId,
      category: notification.category,
      title: notification.title,
      body: notification.body,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      deliveryState: notification.deliveryState,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    })
    .from(notification)
    .innerJoin(
      notificationPreference,
      and(
        eq(notificationPreference.tenantId, notification.tenantId),
        eq(notificationPreference.userId, notification.recipientId),
        eq(notificationPreference.category, notification.category),
        eq(notificationPreference.channel, 'email'),
        eq(notificationPreference.frequency, input.frequency),
      ),
    )
    .leftJoin(
      notificationDigestDelivery,
      and(
        eq(notificationDigestDelivery.tenantId, notification.tenantId),
        eq(notificationDigestDelivery.notificationId, notification.id),
        eq(notificationDigestDelivery.channel, 'email'),
        eq(notificationDigestDelivery.frequency, input.frequency),
      ),
    )
    .where(
      and(
        eq(notification.tenantId, input.tenantId),
        gte(notification.createdAt, input.windowStart),
        lt(notification.createdAt, input.windowEnd),
        isNull(notificationDigestDelivery.id),
      ),
    )
    .orderBy(asc(notification.recipientId), asc(notification.createdAt), asc(notification.id))
    .limit(input.limit);

  return rows.map((row) => NotificationRecord.parse(row));
};

export type SaveNotificationDigestDeliveriesInput = {
  tenantId: string;
  recipientId: string;
  channel: 'email';
  frequency: NotificationDigestFrequency;
  notificationIds: string[];
  deliveredAt: Date;
};

export const saveNotificationDigestDeliveries = async (
  db: Database,
  input: SaveNotificationDigestDeliveriesInput,
): Promise<void> => {
  await db.transaction(async (tx) => {
    for (const notificationId of input.notificationIds) {
      await tx
        .insert(notificationDigestDelivery)
        .values({
          id: ulid(),
          tenantId: TenantId.parse(input.tenantId),
          recipientId: UserId.parse(input.recipientId),
          notificationId,
          channel: input.channel,
          frequency: input.frequency,
          deliveredAt: input.deliveredAt,
          createdAt: input.deliveredAt,
        })
        .onConflictDoNothing()
        .returning();
    }
  });
};

export type ListNotificationPreferencesForUserInput = {
  tenantId: string;
  userId: string;
};

export const listNotificationPreferencesForUser = async (
  db: Database,
  input: ListNotificationPreferencesForUserInput,
): Promise<NotificationPreferenceContract[]> => {
  const rows = await db
    .select()
    .from(notificationPreference)
    .where(
      and(
        eq(notificationPreference.tenantId, input.tenantId),
        eq(notificationPreference.userId, input.userId),
      ),
    )
    .orderBy(asc(notificationPreference.category), asc(notificationPreference.channel));

  return rows.map((row) => NotificationPreference.parse(row));
};

export type UpsertNotificationPreferenceInput = {
  tenantId: string;
  userId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
};

// Upserts a notification preference for a user. The unique key is
// (tenant, user, category, channel); a duplicate write updates the frequency.
export const upsertNotificationPreference = async (
  db: Database,
  input: UpsertNotificationPreferenceInput,
  now = new Date(),
): Promise<NotificationPreferenceContract> => {
  const [row] = await db
    .insert(notificationPreference)
    .values({
      id: NotificationPreferenceId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      userId: UserId.parse(input.userId),
      category: input.category,
      channel: input.channel,
      frequency: input.frequency,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        notificationPreference.tenantId,
        notificationPreference.userId,
        notificationPreference.category,
        notificationPreference.channel,
      ],
      set: { frequency: input.frequency, updatedAt: now },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Notification preference could not be saved because the database returned no row.',
    );
  }

  return NotificationPreference.parse(row);
};

export const markNotificationRead = async (
  db: Database,
  tenantId: string,
  notificationId: string,
  readAt: Date,
): Promise<NotificationRecordContract | null> => {
  const [row] = await db
    .update(notification)
    .set({ readAt })
    .where(and(eq(notification.tenantId, tenantId), eq(notification.id, notificationId)))
    .returning();

  return row ? NotificationRecord.parse(row) : null;
};

export type MarkNotificationReadForRecipientInput = {
  tenantId: string;
  recipientId: string;
  notificationId: string;
  readAt: Date;
};

export const markNotificationReadForRecipient = async (
  db: Database,
  input: MarkNotificationReadForRecipientInput,
): Promise<NotificationRecordContract | null> => {
  const [row] = await db
    .update(notification)
    .set({ readAt: input.readAt })
    .where(
      and(
        eq(notification.tenantId, input.tenantId),
        eq(notification.recipientId, input.recipientId),
        eq(notification.id, input.notificationId),
      ),
    )
    .returning();

  return row ? NotificationRecord.parse(row) : null;
};

export type RegisterUserPushTokenInput = {
  tenantId: string;
  userId: string;
  platform: UserPushTokenPlatform;
  token: string;
  locale: string | null;
  appVersion: string | null;
  lastUsedAt: Date;
};

// Registers a push token. Upserts by (tenant, user, platform, token) so
// re-registering the same device refreshes lastUsedAt/locale/appVersion.
export const registerUserPushToken = async (
  db: Database,
  input: RegisterUserPushTokenInput,
  now = new Date(),
): Promise<UserPushTokenContract> => {
  const newId = UserPushTokenId.parse(ulid());
  const [row] = await db
    .insert(userPushToken)
    .values({
      id: newId,
      tenantId: TenantId.parse(input.tenantId),
      userId: UserId.parse(input.userId),
      platform: input.platform,
      token: input.token,
      locale: input.locale,
      appVersion: input.appVersion,
      lastUsedAt: input.lastUsedAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        userPushToken.tenantId,
        userPushToken.userId,
        userPushToken.platform,
        userPushToken.token,
      ],
      set: {
        locale: input.locale,
        appVersion: input.appVersion,
        lastUsedAt: input.lastUsedAt,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error('Push token could not be registered because the database returned no row.');
  }

  return UserPushToken.parse(row);
};

export type ListUserPushTokensInput = {
  tenantId: string;
  userId: string;
};

export const listUserPushTokens = async (
  db: Database,
  input: ListUserPushTokensInput,
): Promise<UserPushTokenContract[]> => {
  const rows = await db
    .select()
    .from(userPushToken)
    .where(and(eq(userPushToken.tenantId, input.tenantId), eq(userPushToken.userId, input.userId)))
    .orderBy(desc(userPushToken.lastUsedAt));

  return rows.map((row) => UserPushToken.parse(row));
};

export type RevokeUserPushTokenInput = {
  tenantId: string;
  userId: string;
  tokenId: string;
};

export const revokeUserPushToken = async (
  db: Database,
  input: RevokeUserPushTokenInput,
): Promise<boolean> => {
  const result = await db
    .delete(userPushToken)
    .where(
      and(
        eq(userPushToken.tenantId, input.tenantId),
        eq(userPushToken.userId, input.userId),
        eq(userPushToken.id, input.tokenId),
      ),
    )
    .returning({ id: userPushToken.id });

  return result.length > 0;
};
