import { OutboxEvent } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchNotificationDeliveries,
  readNotificationDispatchLimit,
} from '../src/notification-delivery.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {}, close: vi.fn() },
  getUserById: vi.fn(),
  listPendingNotificationDeliveryEvents: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  listUserPushTokens: vi.fn(),
  markOutboxEventProcessed: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getUserById: coreMocks.getUserById,
    listPendingNotificationDeliveryEvents: coreMocks.listPendingNotificationDeliveryEvents,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    listUserPushTokens: coreMocks.listUserPushTokens,
    markOutboxEventProcessed: coreMocks.markOutboxEventProcessed,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const recipientId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const pushTokenId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const now = new Date('2026-05-13T12:00:00.000Z');

const environment = {
  DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  NOTIFICATION_EMAIL_DELIVERY_URL: 'https://delivery.example.test/email',
  NOTIFICATION_PUSH_DELIVERY_URL: 'https://delivery.example.test/push',
};

const createEvent = (eventType: 'notification.email_requested' | 'notification.push_requested') =>
  OutboxEvent.parse({
    id: eventId,
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

const createFetch = (response: { ok: boolean; status: number; statusText: string }) =>
  vi.fn().mockResolvedValue(response);

describe('notification delivery dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.dbHandle.close.mockResolvedValue(undefined);
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getUserById.mockResolvedValue({
      id: recipientId,
      email: 'learner@example.test',
      displayName: 'Learner Example',
      emailVerified: true,
      locale: null,
      timezone: null,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.listPendingNotificationDeliveryEvents.mockResolvedValue([]);
    coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, userId: recipientId }]);
    coreMocks.listUserPushTokens.mockResolvedValue([
      {
        id: pushTokenId,
        tenantId,
        userId: recipientId,
        platform: 'web',
        token: 'push-token',
        locale: null,
        appVersion: null,
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.markOutboxEventProcessed.mockImplementation(
      async (_db, _tenantId, id, processedAt) => ({
        ...createEvent('notification.email_requested'),
        id,
        processedAt,
      }),
    );
  });

  it('dispatches email delivery events to the configured email endpoint', async () => {
    coreMocks.listPendingNotificationDeliveryEvents.mockResolvedValue([
      createEvent('notification.email_requested'),
    ]);
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchNotificationDeliveries(environment, { tenantId, now, fetch });

    expect(result).toMatchObject({ processed: 1, failed: 0, skipped: 0 });
    expect(fetch).toHaveBeenCalledWith(
      'https://delivery.example.test/email',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          recipient: {
            id: recipientId,
            email: 'learner@example.test',
            displayName: 'Learner Example',
          },
          category: 'grade_published',
          title: 'Grade published',
          body: 'Your instructor published a grade.',
          resourceType: 'submission',
          resourceId,
        }),
      }),
    );
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
    expect(coreMocks.dbHandle.close).toHaveBeenCalledTimes(1);
  });

  it('dispatches push delivery events to the configured push endpoint', async () => {
    coreMocks.listPendingNotificationDeliveryEvents.mockResolvedValue([
      createEvent('notification.push_requested'),
    ]);
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchNotificationDeliveries(environment, { tenantId, now, fetch });

    expect(result.processed).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://delivery.example.test/push',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          token: 'push-token',
          platform: 'web',
          title: 'Grade published',
          body: 'Your instructor published a grade.',
          data: {
            eventId,
            category: 'grade_published',
            resourceType: 'submission',
            resourceId,
          },
        }),
      }),
    );
  });

  it('leaves email events unprocessed when email delivery is not configured', async () => {
    coreMocks.listPendingNotificationDeliveryEvents.mockResolvedValue([
      createEvent('notification.email_requested'),
    ]);
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchNotificationDeliveries(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
        NOTIFICATION_PUSH_DELIVERY_URL: environment.NOTIFICATION_PUSH_DELIVERY_URL,
      },
      { tenantId, now, fetch },
    );

    expect(result).toMatchObject({ processed: 0, failed: 1, skipped: 0 });
    expect(fetch).not.toHaveBeenCalled();
    expect(coreMocks.markOutboxEventProcessed).not.toHaveBeenCalled();
  });

  it('leaves email events unprocessed when the recipient is missing', async () => {
    coreMocks.getUserById.mockResolvedValue(null);
    coreMocks.listPendingNotificationDeliveryEvents.mockResolvedValue([
      createEvent('notification.email_requested'),
    ]);
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchNotificationDeliveries(environment, { tenantId, now, fetch });

    expect(result.failed).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(coreMocks.markOutboxEventProcessed).not.toHaveBeenCalled();
  });

  it('leaves email events unprocessed when the recipient is outside the tenant', async () => {
    coreMocks.listUserTenantMemberships.mockResolvedValue([]);
    coreMocks.listPendingNotificationDeliveryEvents.mockResolvedValue([
      createEvent('notification.email_requested'),
    ]);
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchNotificationDeliveries(environment, { tenantId, now, fetch });

    expect(result.failed).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
    expect(coreMocks.markOutboxEventProcessed).not.toHaveBeenCalled();
  });

  it('validates notification dispatcher limits from the environment', () => {
    expect(readNotificationDispatchLimit({})).toBe(50);
    expect(readNotificationDispatchLimit({ NOTIFICATION_DISPATCH_LIMIT: '10' })).toBe(10);
    expect(() => readNotificationDispatchLimit({ NOTIFICATION_DISPATCH_LIMIT: '0' })).toThrow(
      'NOTIFICATION_DISPATCH_LIMIT must be an integer between 1 and 500.',
    );
  });
});
