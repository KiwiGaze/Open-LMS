import { NotificationRecord } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchNotificationEmailDigests,
  readNotificationDigestDispatchLimit,
} from '../src/notification-digest.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {}, close: vi.fn() },
  getUserById: vi.fn(),
  listPendingEmailDigestNotifications: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveNotificationDigestDeliveries: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getUserById: coreMocks.getUserById,
    listPendingEmailDigestNotifications: coreMocks.listPendingEmailDigestNotifications,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveNotificationDigestDeliveries: coreMocks.saveNotificationDigestDeliveries,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const recipientId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const notificationId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const now = new Date('2026-05-14T00:00:00.000Z');
const windowStart = new Date('2026-05-13T00:00:00.000Z');
const windowEnd = new Date('2026-05-14T00:00:00.000Z');

const notification = NotificationRecord.parse({
  id: notificationId,
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

const environment = {
  DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  NOTIFICATION_EMAIL_DIGEST_DELIVERY_URL: 'https://delivery.example.test/digests',
};

const createFetch = (response: { ok: boolean; status: number; statusText: string }) =>
  vi.fn().mockResolvedValue(response);

describe('notification email digest dispatcher', () => {
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
    coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, userId: recipientId }]);
    coreMocks.listPendingEmailDigestNotifications.mockResolvedValue([notification]);
    coreMocks.saveNotificationDigestDeliveries.mockResolvedValue(undefined);
  });

  it('dispatches email digests to the configured endpoint and records delivery', async () => {
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchNotificationEmailDigests(environment, {
      tenantId,
      frequency: 'daily_digest',
      windowStart,
      windowEnd,
      now,
      fetch,
    });

    expect(result).toEqual({ recipientsProcessed: 1, notificationsProcessed: 1, failed: 0 });
    expect(coreMocks.listPendingEmailDigestNotifications).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      { tenantId, frequency: 'daily_digest', windowStart, windowEnd, limit: 50 },
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://delivery.example.test/digests',
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
          frequency: 'daily_digest',
          windowStart: windowStart.toISOString(),
          windowEnd: windowEnd.toISOString(),
          notifications: [
            {
              id: notificationId,
              category: 'grade_published',
              title: 'Grade published',
              body: 'Your instructor published a grade.',
              resourceType: 'submission',
              resourceId,
              createdAt: now.toISOString(),
            },
          ],
        }),
      }),
    );
    expect(coreMocks.saveNotificationDigestDeliveries).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      recipientId,
      channel: 'email',
      frequency: 'daily_digest',
      notificationIds: [notificationId],
      deliveredAt: now,
    });
    expect(coreMocks.dbHandle.close).toHaveBeenCalledTimes(1);
  });

  it('validates digest dispatcher limits from the environment', () => {
    expect(readNotificationDigestDispatchLimit({})).toBe(50);
    expect(readNotificationDigestDispatchLimit({ NOTIFICATION_DIGEST_DISPATCH_LIMIT: '10' })).toBe(
      10,
    );
    expect(() =>
      readNotificationDigestDispatchLimit({ NOTIFICATION_DIGEST_DISPATCH_LIMIT: '0' }),
    ).toThrow('NOTIFICATION_DIGEST_DISPATCH_LIMIT must be an integer between 1 and 500.');
  });
});
