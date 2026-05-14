import {
  type NotificationCategory,
  NotificationCategory as NotificationCategorySchema,
  type NotificationFrequency,
  type NotificationPreference,
  NotificationRecord,
  type NotificationRecord as NotificationRecordContract,
  OutboxEvent,
  type OutboxEvent as OutboxEventContract,
  OutboxEventId,
  TenantId,
  UserId,
  type UserPushToken,
} from '@openlms/contracts';
import { ulid } from 'ulid';
import { z } from 'zod';

export type NotificationIntent = {
  tenantId: string;
  recipientId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  resourceType: string;
  resourceId: string;
};

export type NotificationProducerPorts = {
  listNotificationPreferencesForUser: (input: {
    tenantId: string;
    userId: string;
  }) => Promise<NotificationPreference[]>;
  saveProducedNotification: (input: ProducedNotification) => Promise<ProducedNotification>;
};

export type NotificationBatchProducerPorts = {
  listNotificationPreferencesForUser: (input: {
    tenantId: string;
    userId: string;
  }) => Promise<NotificationPreference[]>;
  saveProducedNotifications: (input: ProducedNotification[]) => Promise<ProducedNotification[]>;
};

export type ProducedNotification = {
  notification: NotificationRecordContract | null;
  deliveryEvents: OutboxEventContract[];
};

const NotificationDeliveryPayload = z
  .object({
    recipientId: UserId,
    category: NotificationCategorySchema,
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(2000),
    resourceType: z.string().min(1),
    resourceId: z.string().min(1),
  })
  .strict();
type NotificationDeliveryPayload = z.infer<typeof NotificationDeliveryPayload>;

export type EmailNotificationMessage = NotificationDeliveryPayload & {
  tenantId: string;
};

export type PushNotificationMessage = {
  tenantId: string;
  token: string;
  platform: UserPushToken['platform'];
  title: string;
  body: string;
  data: {
    eventId: string;
    category: NotificationCategory;
    resourceType: string;
    resourceId: string;
  };
};

export type NotificationDeliveryDispatcherPorts = {
  listPendingNotificationDeliveryEvents: (
    tenantId: string,
    limit: number,
  ) => Promise<OutboxEventContract[]>;
  markOutboxEventProcessed: (
    tenantId: string,
    eventId: string,
    processedAt: Date,
  ) => Promise<OutboxEventContract>;
  listUserPushTokens: (input: { tenantId: string; userId: string }) => Promise<UserPushToken[]>;
  sendEmail: (message: EmailNotificationMessage) => Promise<void>;
  sendPush: (message: PushNotificationMessage) => Promise<void>;
};

export type NotificationDeliveryBatchResult = {
  processed: number;
  failed: number;
  skipped: number;
};

export type EmailDigestFrequency = Extract<NotificationFrequency, 'daily_digest' | 'weekly_digest'>;

export type EmailDigestNotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
};

export type EmailDigestMessage = {
  tenantId: string;
  recipientId: string;
  frequency: EmailDigestFrequency;
  windowStart: Date;
  windowEnd: Date;
  notifications: EmailDigestNotificationItem[];
};

export type NotificationEmailDigestDispatcherPorts = {
  listPendingEmailDigestNotifications: (input: {
    tenantId: string;
    frequency: EmailDigestFrequency;
    windowStart: Date;
    windowEnd: Date;
    limit: number;
  }) => Promise<NotificationRecordContract[]>;
  sendEmailDigest: (message: EmailDigestMessage) => Promise<void>;
  saveNotificationDigestDeliveries: (input: {
    tenantId: string;
    recipientId: string;
    channel: 'email';
    frequency: EmailDigestFrequency;
    notificationIds: string[];
    deliveredAt: Date;
  }) => Promise<void>;
};

export type NotificationEmailDigestBatchResult = {
  recipientsProcessed: number;
  notificationsProcessed: number;
  failed: number;
};

const findFrequency = (
  preferences: NotificationPreference[],
  channel: 'in_app' | 'email' | 'push',
  category: NotificationCategory,
): NotificationPreference['frequency'] | null =>
  preferences.find(
    (preference) => preference.channel === channel && preference.category === category,
  )?.frequency ?? null;

const shouldDeliverImmediately = (
  preferences: NotificationPreference[],
  channel: 'in_app' | 'email' | 'push',
  category: NotificationCategory,
): boolean => {
  const frequency = findFrequency(preferences, channel, category);

  if (channel === 'in_app') {
    return (frequency ?? 'immediate') === 'immediate';
  }

  return frequency === 'immediate';
};

const buildNotificationDeliveryEvent = (
  input: NotificationIntent,
  eventType: 'notification.email_requested' | 'notification.push_requested',
  now: Date,
): OutboxEventContract =>
  OutboxEvent.parse({
    id: OutboxEventId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    topic: 'notification.delivery',
    eventType,
    schemaVersion: '1',
    payload: {
      recipientId: UserId.parse(input.recipientId),
      category: input.category,
      title: input.title,
      body: input.body,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    },
    occurredAt: now,
    processedAt: null,
  });

export const produceNotification = async (
  ports: NotificationProducerPorts,
  input: NotificationIntent,
  now = new Date(),
): Promise<ProducedNotification> => {
  const preferences = await ports.listNotificationPreferencesForUser({
    tenantId: input.tenantId,
    userId: input.recipientId,
  });
  const producedNotification = buildProducedNotification(preferences, input, now);

  if (
    producedNotification.notification === null &&
    producedNotification.deliveryEvents.length === 0
  ) {
    return { notification: null, deliveryEvents: [] };
  }

  return ports.saveProducedNotification(producedNotification);
};

const buildProducedNotification = (
  preferences: NotificationPreference[],
  input: NotificationIntent,
  now: Date,
): ProducedNotification => {
  const deliveryEvents: OutboxEventContract[] = [];

  const notification: NotificationRecordContract | null = shouldDeliverImmediately(
    preferences,
    'in_app',
    input.category,
  )
    ? NotificationRecord.parse({
        id: ulid(),
        tenantId: TenantId.parse(input.tenantId),
        recipientId: UserId.parse(input.recipientId),
        category: input.category,
        title: input.title,
        body: input.body,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        deliveryState: 'sent',
        readAt: null,
        createdAt: now,
      })
    : null;

  if (shouldDeliverImmediately(preferences, 'email', input.category)) {
    deliveryEvents.push(buildNotificationDeliveryEvent(input, 'notification.email_requested', now));
  }

  if (shouldDeliverImmediately(preferences, 'push', input.category)) {
    deliveryEvents.push(buildNotificationDeliveryEvent(input, 'notification.push_requested', now));
  }

  return { notification, deliveryEvents };
};

export const produceNotifications = async (
  ports: NotificationBatchProducerPorts,
  inputs: NotificationIntent[],
  now = new Date(),
): Promise<ProducedNotification[]> => {
  const producedNotifications: ProducedNotification[] = [];

  for (const input of inputs) {
    const preferences = await ports.listNotificationPreferencesForUser({
      tenantId: input.tenantId,
      userId: input.recipientId,
    });
    const producedNotification = buildProducedNotification(preferences, input, now);

    if (
      producedNotification.notification !== null ||
      producedNotification.deliveryEvents.length > 0
    ) {
      producedNotifications.push(producedNotification);
    }
  }

  if (producedNotifications.length === 0) {
    return [];
  }

  return ports.saveProducedNotifications(producedNotifications);
};

const dispatchEmail = async (
  ports: NotificationDeliveryDispatcherPorts,
  tenantId: string,
  payload: NotificationDeliveryPayload,
): Promise<void> => {
  await ports.sendEmail({ tenantId, ...payload });
};

const dispatchPush = async (
  ports: NotificationDeliveryDispatcherPorts,
  tenantId: string,
  eventId: string,
  payload: NotificationDeliveryPayload,
): Promise<void> => {
  const tokens = await ports.listUserPushTokens({
    tenantId,
    userId: payload.recipientId,
  });

  for (const token of tokens) {
    await ports.sendPush({
      tenantId,
      token: token.token,
      platform: token.platform,
      title: payload.title,
      body: payload.body,
      data: {
        eventId,
        category: payload.category,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
      },
    });
  }
};

export const dispatchNotificationDeliveryBatch = async (
  ports: NotificationDeliveryDispatcherPorts,
  input: { tenantId: string; limit: number; now?: Date },
): Promise<NotificationDeliveryBatchResult> => {
  const now = input.now ?? new Date();
  const events = await ports.listPendingNotificationDeliveryEvents(input.tenantId, input.limit);
  const result: NotificationDeliveryBatchResult = { processed: 0, failed: 0, skipped: 0 };

  for (const event of events) {
    if (event.topic !== 'notification.delivery') {
      result.skipped += 1;
      continue;
    }

    if (
      event.eventType !== 'notification.email_requested' &&
      event.eventType !== 'notification.push_requested'
    ) {
      result.skipped += 1;
      continue;
    }

    try {
      const payload = NotificationDeliveryPayload.parse(event.payload);

      if (event.eventType === 'notification.email_requested') {
        await dispatchEmail(ports, event.tenantId, payload);
      } else {
        await dispatchPush(ports, event.tenantId, event.id, payload);
      }

      await ports.markOutboxEventProcessed(event.tenantId, event.id, now);
      result.processed += 1;
    } catch {
      result.failed += 1;
    }
  }

  return result;
};

const toEmailDigestItem = (
  notification: NotificationRecordContract,
): EmailDigestNotificationItem => ({
  id: notification.id,
  category: notification.category,
  title: notification.title,
  body: notification.body,
  resourceType: notification.resourceType,
  resourceId: notification.resourceId,
  createdAt: notification.createdAt,
});

export const dispatchNotificationEmailDigestBatch = async (
  ports: NotificationEmailDigestDispatcherPorts,
  input: {
    tenantId: string;
    frequency: EmailDigestFrequency;
    windowStart: Date;
    windowEnd: Date;
    limit: number;
    now?: Date;
  },
): Promise<NotificationEmailDigestBatchResult> => {
  const now = input.now ?? new Date();
  const notifications = await ports.listPendingEmailDigestNotifications({
    tenantId: input.tenantId,
    frequency: input.frequency,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    limit: input.limit,
  });
  const notificationsByRecipient = new Map<string, NotificationRecordContract[]>();
  const result: NotificationEmailDigestBatchResult = {
    recipientsProcessed: 0,
    notificationsProcessed: 0,
    failed: 0,
  };

  for (const notification of notifications) {
    const existing = notificationsByRecipient.get(notification.recipientId) ?? [];
    existing.push(notification);
    notificationsByRecipient.set(notification.recipientId, existing);
  }

  for (const [recipientId, recipientNotifications] of notificationsByRecipient.entries()) {
    try {
      await ports.sendEmailDigest({
        tenantId: input.tenantId,
        recipientId,
        frequency: input.frequency,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
        notifications: recipientNotifications.map(toEmailDigestItem),
      });

      await ports.saveNotificationDigestDeliveries({
        tenantId: input.tenantId,
        recipientId,
        channel: 'email',
        frequency: input.frequency,
        notificationIds: recipientNotifications.map((notification) => notification.id),
        deliveredAt: now,
      });
      result.recipientsProcessed += 1;
      result.notificationsProcessed += recipientNotifications.length;
    } catch {
      result.failed += 1;
    }
  }

  return result;
};
