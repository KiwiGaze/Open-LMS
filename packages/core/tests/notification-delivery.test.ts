import {
  NotificationPreference,
  NotificationRecord,
  OutboxEvent,
  UserPushToken,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  dispatchNotificationDeliveryBatch,
  dispatchNotificationEmailDigestBatch,
  produceNotification,
  produceNotifications,
} from '../src/notifications/delivery.ts';

const now = new Date('2026-05-13T10:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const recipientId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const emailEventId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const pushEventId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const pushTokenId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';

const notificationInput = {
  tenantId,
  recipientId,
  category: 'grade_published' as const,
  title: 'Grade published',
  body: 'Your instructor published a grade.',
  resourceType: 'submission',
  resourceId,
};

const digestNotification = NotificationRecord.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE40',
  tenantId,
  recipientId,
  category: 'grade_published',
  title: 'Grade published',
  body: 'Your instructor published a grade.',
  resourceType: 'submission',
  resourceId,
  deliveryState: 'sent',
  readAt: null,
  createdAt: now,
});

const createPreference = (input: {
  id: string;
  channel: 'in_app' | 'email' | 'push';
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'off';
}) =>
  NotificationPreference.parse({
    id: input.id,
    tenantId,
    userId: recipientId,
    category: 'grade_published',
    channel: input.channel,
    frequency: input.frequency,
    createdAt: now,
    updatedAt: now,
  });

const createDeliveryEvent = (
  id: string,
  eventType: 'notification.email_requested' | 'notification.push_requested',
) =>
  OutboxEvent.parse({
    id,
    tenantId,
    topic: 'notification.delivery',
    eventType,
    payload: {
      recipientId,
      category: 'grade_published',
      title: 'Grade published',
      body: 'Your instructor published a grade.',
      resourceType: 'submission',
      resourceId,
    },
    occurredAt: now,
    processedAt: null,
  });

describe('notification delivery workflow', () => {
  it('stores an in-app notification by default without external delivery events', async () => {
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);

    const result = await produceNotification(
      {
        listNotificationPreferencesForUser: async () => [],
        saveProducedNotification,
      },
      notificationInput,
      now,
    );

    expect(result.notification?.deliveryState).toBe('sent');
    expect(saveProducedNotification).toHaveBeenCalledWith({
      notification: expect.objectContaining({
        tenantId,
        recipientId,
        category: 'grade_published',
        resourceType: 'submission',
        resourceId,
        deliveryState: 'sent',
      }),
      deliveryEvents: [],
    });
  });

  it('creates immediate email and push delivery events from explicit preferences', async () => {
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);

    const result = await produceNotification(
      {
        listNotificationPreferencesForUser: async () => [
          createPreference({
            id: '01J9QW7B6N5W2YH3D3A1V0KE30',
            channel: 'email',
            frequency: 'immediate',
          }),
          createPreference({
            id: '01J9QW7B6N5W2YH3D3A1V0KE31',
            channel: 'push',
            frequency: 'immediate',
          }),
        ],
        saveProducedNotification,
      },
      notificationInput,
      now,
    );

    expect(result.deliveryEvents.map((event) => event.eventType).sort()).toEqual([
      'notification.email_requested',
      'notification.push_requested',
    ]);
    expect(saveProducedNotification).toHaveBeenCalledTimes(1);
    expect(saveProducedNotification).toHaveBeenCalledWith({
      notification: expect.objectContaining({ category: 'grade_published' }),
      deliveryEvents: [
        expect.objectContaining({ eventType: 'notification.email_requested' }),
        expect.objectContaining({ eventType: 'notification.push_requested' }),
      ],
    });
  });

  it('saves multi-recipient notification batches in one producer call', async () => {
    const saveProducedNotifications = vi.fn().mockImplementation(async (output) => output);

    const result = await produceNotifications(
      {
        listNotificationPreferencesForUser: async () => [],
        saveProducedNotifications,
      },
      [
        notificationInput,
        {
          ...notificationInput,
          recipientId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        },
      ],
      now,
    );

    expect(result).toHaveLength(2);
    expect(saveProducedNotifications).toHaveBeenCalledTimes(1);
    expect(saveProducedNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        notification: expect.objectContaining({ recipientId }),
        deliveryEvents: [],
      }),
      expect.objectContaining({
        notification: expect.objectContaining({
          recipientId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        }),
        deliveryEvents: [],
      }),
    ]);
  });

  it('does not deliver channels set to off or digest frequencies immediately', async () => {
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);

    const result = await produceNotification(
      {
        listNotificationPreferencesForUser: async () => [
          createPreference({
            id: '01J9QW7B6N5W2YH3D3A1V0KE32',
            channel: 'in_app',
            frequency: 'off',
          }),
          createPreference({
            id: '01J9QW7B6N5W2YH3D3A1V0KE33',
            channel: 'email',
            frequency: 'daily_digest',
          }),
          createPreference({
            id: '01J9QW7B6N5W2YH3D3A1V0KE34',
            channel: 'push',
            frequency: 'off',
          }),
        ],
        saveProducedNotification,
      },
      notificationInput,
      now,
    );

    expect(result.notification).toBeNull();
    expect(result.deliveryEvents).toEqual([]);
    expect(saveProducedNotification).not.toHaveBeenCalled();
  });

  it('dispatches email events and marks them processed after provider success', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const markOutboxEventProcessed = vi.fn().mockImplementation(async (event) => event);

    const result = await dispatchNotificationDeliveryBatch(
      {
        listPendingNotificationDeliveryEvents: async () => [
          createDeliveryEvent(emailEventId, 'notification.email_requested'),
        ],
        listUserPushTokens: async () => [],
        markOutboxEventProcessed,
        sendEmail,
        sendPush: vi.fn(),
      },
      { tenantId, limit: 10, now },
    );

    expect(sendEmail).toHaveBeenCalledWith({
      tenantId,
      recipientId,
      category: 'grade_published',
      title: 'Grade published',
      body: 'Your instructor published a grade.',
      resourceType: 'submission',
      resourceId,
    });
    expect(markOutboxEventProcessed).toHaveBeenCalledWith(tenantId, emailEventId, now);
    expect(result).toMatchObject({ processed: 1, failed: 0, skipped: 0 });
  });

  it('dispatches push events to every registered token before marking processed', async () => {
    const sendPush = vi.fn().mockResolvedValue(undefined);
    const markOutboxEventProcessed = vi.fn().mockImplementation(async (event) => event);

    const result = await dispatchNotificationDeliveryBatch(
      {
        listPendingNotificationDeliveryEvents: async () => [
          createDeliveryEvent(pushEventId, 'notification.push_requested'),
        ],
        listUserPushTokens: async () => [
          UserPushToken.parse({
            id: pushTokenId,
            tenantId,
            userId: recipientId,
            platform: 'ios',
            token: 'sample-token',
            locale: 'en-US',
            appVersion: '1.0.0',
            lastUsedAt: now,
            createdAt: now,
            updatedAt: now,
          }),
        ],
        markOutboxEventProcessed,
        sendEmail: vi.fn(),
        sendPush,
      },
      { tenantId, limit: 10, now },
    );

    expect(sendPush).toHaveBeenCalledWith({
      tenantId,
      token: 'sample-token',
      platform: 'ios',
      title: 'Grade published',
      body: 'Your instructor published a grade.',
      data: {
        eventId: pushEventId,
        category: 'grade_published',
        resourceType: 'submission',
        resourceId,
      },
    });
    expect(markOutboxEventProcessed).toHaveBeenCalledWith(tenantId, pushEventId, now);
    expect(result.processed).toBe(1);
  });

  it('leaves provider failures unprocessed so the event can be retried', async () => {
    const markOutboxEventProcessed = vi.fn();

    const result = await dispatchNotificationDeliveryBatch(
      {
        listPendingNotificationDeliveryEvents: async () => [
          createDeliveryEvent(emailEventId, 'notification.email_requested'),
        ],
        listUserPushTokens: async () => [],
        markOutboxEventProcessed,
        sendEmail: vi.fn().mockRejectedValue(new Error('provider unavailable')),
        sendPush: vi.fn(),
      },
      { tenantId, limit: 10, now },
    );

    expect(markOutboxEventProcessed).not.toHaveBeenCalled();
    expect(result).toMatchObject({ processed: 0, failed: 1, skipped: 0 });
  });

  it('leaves malformed notification delivery events unprocessed without aborting the batch', async () => {
    const markOutboxEventProcessed = vi.fn();

    const result = await dispatchNotificationDeliveryBatch(
      {
        listPendingNotificationDeliveryEvents: async () => [
          OutboxEvent.parse({
            id: emailEventId,
            tenantId,
            topic: 'notification.delivery',
            eventType: 'notification.email_requested',
            payload: {},
            occurredAt: now,
            processedAt: null,
          }),
        ],
        listUserPushTokens: async () => [],
        markOutboxEventProcessed,
        sendEmail: vi.fn(),
        sendPush: vi.fn(),
      },
      { tenantId, limit: 10, now },
    );

    expect(markOutboxEventProcessed).not.toHaveBeenCalled();
    expect(result).toMatchObject({ processed: 0, failed: 1, skipped: 0 });
  });

  it('groups pending email digest notifications by recipient and records deliveries after send', async () => {
    const secondNotification = NotificationRecord.parse({
      ...digestNotification,
      id: '01J9QW7B6N5W2YH3D3A1V0KE41',
      title: 'Feedback published',
      resourceType: 'published_feedback',
    });
    const sendEmailDigest = vi.fn().mockResolvedValue(undefined);
    const saveNotificationDigestDeliveries = vi.fn().mockResolvedValue(undefined);
    const windowStart = new Date('2026-05-13T00:00:00.000Z');
    const windowEnd = new Date('2026-05-14T00:00:00.000Z');

    const result = await dispatchNotificationEmailDigestBatch(
      {
        listPendingEmailDigestNotifications: vi
          .fn()
          .mockResolvedValue([digestNotification, secondNotification]),
        sendEmailDigest,
        saveNotificationDigestDeliveries,
      },
      {
        tenantId,
        frequency: 'daily_digest',
        windowStart,
        windowEnd,
        limit: 50,
        now,
      },
    );

    expect(result).toEqual({ recipientsProcessed: 1, notificationsProcessed: 2, failed: 0 });
    expect(sendEmailDigest).toHaveBeenCalledWith({
      tenantId,
      recipientId,
      frequency: 'daily_digest',
      windowStart,
      windowEnd,
      notifications: [
        expect.objectContaining({ id: digestNotification.id, title: 'Grade published' }),
        expect.objectContaining({ id: secondNotification.id, title: 'Feedback published' }),
      ],
    });
    expect(saveNotificationDigestDeliveries).toHaveBeenCalledWith({
      tenantId,
      recipientId,
      channel: 'email',
      frequency: 'daily_digest',
      notificationIds: [digestNotification.id, secondNotification.id],
      deliveredAt: now,
    });
  });

  it('does not record email digest deliveries when sending fails', async () => {
    const saveNotificationDigestDeliveries = vi.fn();

    const result = await dispatchNotificationEmailDigestBatch(
      {
        listPendingEmailDigestNotifications: vi.fn().mockResolvedValue([digestNotification]),
        sendEmailDigest: vi.fn().mockRejectedValue(new Error('digest provider unavailable')),
        saveNotificationDigestDeliveries,
      },
      {
        tenantId,
        frequency: 'weekly_digest',
        windowStart: new Date('2026-05-06T00:00:00.000Z'),
        windowEnd: new Date('2026-05-13T00:00:00.000Z'),
        limit: 50,
        now,
      },
    );

    expect(result).toEqual({ recipientsProcessed: 0, notificationsProcessed: 0, failed: 1 });
    expect(saveNotificationDigestDeliveries).not.toHaveBeenCalled();
  });
});
