import type { User } from '@openlms/contracts';
import {
  type EmailDigestFrequency,
  type EmailDigestMessage,
  type NotificationEmailDigestBatchResult,
  createDbHandle,
  dispatchNotificationEmailDigestBatch,
  getUserById,
  listPendingEmailDigestNotifications,
  listUserTenantMemberships,
  saveNotificationDigestDeliveries,
} from '@openlms/core';

export type NotificationDigestEnvironment = {
  DATABASE_CONNECTION_STRING?: string;
  NOTIFICATION_EMAIL_DIGEST_DELIVERY_URL?: string;
  NOTIFICATION_DIGEST_DISPATCH_LIMIT?: string;
};

type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'statusText'>>;

export type NotificationDigestDispatchOptions = {
  tenantId: string;
  frequency: EmailDigestFrequency;
  windowStart: Date;
  windowEnd: Date;
  limit?: number;
  now?: Date;
  fetch?: FetchLike;
};

type EmailDigestDeliveryRequest = {
  tenantId: string;
  recipient: {
    id: string;
    email: string;
    displayName: string;
  };
  frequency: EmailDigestFrequency;
  windowStart: string;
  windowEnd: string;
  notifications: Array<{
    id: string;
    category: string;
    title: string;
    body: string;
    resourceType: string;
    resourceId: string;
    createdAt: string;
  }>;
};

export const readNotificationDigestDispatchLimit = (
  environment: Pick<NotificationDigestEnvironment, 'NOTIFICATION_DIGEST_DISPATCH_LIMIT'>,
): number => {
  const rawLimit = environment.NOTIFICATION_DIGEST_DISPATCH_LIMIT;
  if (rawLimit === undefined || rawLimit.trim() === '') {
    return 50;
  }

  if (!/^[1-9]\d*$/.test(rawLimit)) {
    throw new Error('NOTIFICATION_DIGEST_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  const limit = Number(rawLimit);
  if (limit > 500) {
    throw new Error('NOTIFICATION_DIGEST_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  return limit;
};

const readRequiredDatabaseUrl = (environment: NotificationDigestEnvironment): string => {
  if (!environment.DATABASE_CONNECTION_STRING) {
    throw new Error('DATABASE_CONNECTION_STRING is required to dispatch notification digests.');
  }

  return environment.DATABASE_CONNECTION_STRING;
};

const readDigestDeliveryUrl = (environment: NotificationDigestEnvironment): string => {
  const value = environment.NOTIFICATION_EMAIL_DIGEST_DELIVERY_URL;
  if (!value || value.trim() === '') {
    throw new Error('NOTIFICATION_EMAIL_DIGEST_DELIVERY_URL is required to dispatch digests.');
  }

  const url = new URL(value);
  const isLocalHttp =
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1');
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error(
      'NOTIFICATION_EMAIL_DIGEST_DELIVERY_URL must be an https URL, except local http endpoints.',
    );
  }

  return url.toString();
};

const sendJson = async (fetch: FetchLike, url: string, body: unknown): Promise<void> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Notification digest endpoint responded with ${response.status} ${response.statusText}.`,
    );
  }
};

const buildEmailDigestDeliveryRequest = (
  message: EmailDigestMessage,
  recipient: User,
): EmailDigestDeliveryRequest => ({
  tenantId: message.tenantId,
  recipient: {
    id: recipient.id,
    email: recipient.email,
    displayName: recipient.displayName,
  },
  frequency: message.frequency,
  windowStart: message.windowStart.toISOString(),
  windowEnd: message.windowEnd.toISOString(),
  notifications: message.notifications.map((notification) => ({
    id: notification.id,
    category: notification.category,
    title: notification.title,
    body: notification.body,
    resourceType: notification.resourceType,
    resourceId: notification.resourceId,
    createdAt: notification.createdAt.toISOString(),
  })),
});

export const dispatchNotificationEmailDigests = async (
  environment: NotificationDigestEnvironment,
  options: NotificationDigestDispatchOptions,
): Promise<NotificationEmailDigestBatchResult> => {
  const dbHandle = createDbHandle(readRequiredDatabaseUrl(environment));
  const fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const limit = options.limit ?? readNotificationDigestDispatchLimit(environment);

  try {
    return await dispatchNotificationEmailDigestBatch(
      {
        listPendingEmailDigestNotifications: (input) =>
          listPendingEmailDigestNotifications(dbHandle.db, input),
        sendEmailDigest: async (message) => {
          const recipient = await getUserById(dbHandle.db, message.recipientId);
          if (recipient === null) {
            throw new Error('Notification digest recipient was not found.');
          }

          const memberships = await listUserTenantMemberships(dbHandle.db, message.recipientId);
          const isTenantMember = memberships.some(
            (membership) => membership.tenantId === message.tenantId,
          );
          if (!isTenantMember) {
            throw new Error('Notification digest recipient was not found in this tenant.');
          }

          await sendJson(
            fetch,
            readDigestDeliveryUrl(environment),
            buildEmailDigestDeliveryRequest(message, recipient),
          );
        },
        saveNotificationDigestDeliveries: (input) =>
          saveNotificationDigestDeliveries(dbHandle.db, input),
      },
      {
        tenantId: options.tenantId,
        frequency: options.frequency,
        windowStart: options.windowStart,
        windowEnd: options.windowEnd,
        limit,
        now: options.now,
      },
    );
  } finally {
    await dbHandle.close();
  }
};
