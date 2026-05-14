import type { User } from '@openlms/contracts';
import {
  type EmailNotificationMessage,
  type NotificationDeliveryBatchResult,
  type NotificationDeliveryDispatcherPorts,
  type PushNotificationMessage,
  createDbHandle,
  dispatchNotificationDeliveryBatch,
  getUserById,
  listPendingNotificationDeliveryEvents,
  listUserPushTokens,
  listUserTenantMemberships,
  markOutboxEventProcessed,
} from '@openlms/core';

export type NotificationDeliveryEnvironment = {
  DATABASE_CONNECTION_STRING?: string;
  NOTIFICATION_EMAIL_DELIVERY_URL?: string;
  NOTIFICATION_PUSH_DELIVERY_URL?: string;
  NOTIFICATION_DISPATCH_LIMIT?: string;
};

type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'statusText'>>;

export type NotificationDispatchOptions = {
  tenantId: string;
  limit?: number;
  now?: Date;
  fetch?: FetchLike;
};

type EmailDeliveryRequest = {
  tenantId: string;
  recipient: {
    id: string;
    email: string;
    displayName: string;
  };
  category: string;
  title: string;
  body: string;
  resourceType: string;
  resourceId: string;
};

type PushDeliveryRequest = PushNotificationMessage;

export const readNotificationDispatchLimit = (
  environment: Pick<NotificationDeliveryEnvironment, 'NOTIFICATION_DISPATCH_LIMIT'>,
): number => {
  const rawLimit = environment.NOTIFICATION_DISPATCH_LIMIT;
  if (rawLimit === undefined || rawLimit.trim() === '') {
    return 50;
  }

  if (!/^[1-9]\d*$/.test(rawLimit)) {
    throw new Error('NOTIFICATION_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  const limit = Number(rawLimit);
  if (limit > 500) {
    throw new Error('NOTIFICATION_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  return limit;
};

const readRequiredDatabaseUrl = (environment: NotificationDeliveryEnvironment): string => {
  if (!environment.DATABASE_CONNECTION_STRING) {
    throw new Error('DATABASE_CONNECTION_STRING is required to dispatch notifications.');
  }

  return environment.DATABASE_CONNECTION_STRING;
};

const readDeliveryUrl = (value: string | undefined, name: string): string => {
  if (!value || value.trim() === '') {
    throw new Error(`${name} is required for this notification delivery channel.`);
  }

  const url = new URL(value);
  const isLocalHttp =
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1');
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error(`${name} must be an https URL, except local http endpoints.`);
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
      `Notification delivery endpoint responded with ${response.status} ${response.statusText}.`,
    );
  }
};

const buildEmailDeliveryRequest = (
  message: EmailNotificationMessage,
  recipient: User,
): EmailDeliveryRequest => ({
  tenantId: message.tenantId,
  recipient: {
    id: recipient.id,
    email: recipient.email,
    displayName: recipient.displayName,
  },
  category: message.category,
  title: message.title,
  body: message.body,
  resourceType: message.resourceType,
  resourceId: message.resourceId,
});

export const dispatchNotificationDeliveries = async (
  environment: NotificationDeliveryEnvironment,
  options: NotificationDispatchOptions,
): Promise<NotificationDeliveryBatchResult> => {
  const dbHandle = createDbHandle(readRequiredDatabaseUrl(environment));
  const fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const limit = options.limit ?? readNotificationDispatchLimit(environment);

  try {
    const ports: NotificationDeliveryDispatcherPorts = {
      listPendingNotificationDeliveryEvents: (tenantId, limit) =>
        listPendingNotificationDeliveryEvents(dbHandle.db, tenantId, limit),
      markOutboxEventProcessed: (tenantId, eventId, processedAt) =>
        markOutboxEventProcessed(dbHandle.db, tenantId, eventId, processedAt),
      listUserPushTokens: (input) => listUserPushTokens(dbHandle.db, input),
      sendEmail: async (message) => {
        const url = readDeliveryUrl(
          environment.NOTIFICATION_EMAIL_DELIVERY_URL,
          'NOTIFICATION_EMAIL_DELIVERY_URL',
        );
        const recipient = await getUserById(dbHandle.db, message.recipientId);
        if (recipient === null) {
          throw new Error('Notification recipient was not found.');
        }
        const memberships = await listUserTenantMemberships(dbHandle.db, message.recipientId);
        const isTenantMember = memberships.some(
          (membership) => membership.tenantId === message.tenantId,
        );
        if (!isTenantMember) {
          throw new Error('Notification recipient was not found in this tenant.');
        }

        await sendJson(fetch, url, buildEmailDeliveryRequest(message, recipient));
      },
      sendPush: async (message: PushNotificationMessage) => {
        const url = readDeliveryUrl(
          environment.NOTIFICATION_PUSH_DELIVERY_URL,
          'NOTIFICATION_PUSH_DELIVERY_URL',
        );
        const request: PushDeliveryRequest = message;
        await sendJson(fetch, url, request);
      },
    };

    return await dispatchNotificationDeliveryBatch(ports, {
      tenantId: options.tenantId,
      limit,
      now: options.now,
    });
  } finally {
    await dbHandle.close();
  }
};
