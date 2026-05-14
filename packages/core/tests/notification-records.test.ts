import { NotificationPreference, NotificationRecord, OutboxEvent } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  listNotificationPreferencesForUser,
  listNotificationsForRecipient,
  markNotificationRead,
  markNotificationReadForRecipient,
  saveNotification,
  saveNotificationDigestDeliveries,
  saveProducedNotification,
  saveProducedNotifications,
} from '../src/notifications/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const recipientId = '01J9QW7B6N5W2YH3D3A1V0KE2V';

const notification = NotificationRecord.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  recipientId,
  category: 'feedback_published',
  title: 'Feedback published',
  body: 'Your instructor published feedback for Evidence essay.',
  resourceType: 'published_feedback',
  resourceId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  deliveryState: 'pending',
  readAt: null,
  createdAt: now,
});

const notificationPreference = NotificationPreference.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  userId: recipientId,
  category: 'grade_published',
  channel: 'email',
  frequency: 'daily_digest',
  createdAt: now,
  updatedAt: now,
});

const notificationDeliveryEvent = OutboxEvent.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE32',
  tenantId,
  topic: 'notification.delivery',
  eventType: 'notification.email_requested',
  payload: {
    recipientId,
    category: 'feedback_published',
    title: 'Feedback published',
    body: 'Your instructor published feedback for Evidence essay.',
    resourceType: 'published_feedback',
    resourceId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  },
  occurredAt: now,
  processedAt: null,
});

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createTransactionalInsertDb = <T>(): {
  db: Database;
  insertedRows: T[];
  transactionCalls: number;
} => {
  const insertedRows: T[] = [];
  const tx = {
    insert: () => ({
      values: (value: T) => ({
        returning: async () => {
          insertedRows.push(value);
          return [value];
        },
        onConflictDoNothing: () => ({
          returning: async () => {
            insertedRows.push(value);
            return [value];
          },
        }),
      }),
    }),
  };

  return {
    db: {
      transaction: async <R>(callback: (transaction: typeof tx) => Promise<R>) => callback(tx),
    } as unknown as Database,
    insertedRows,
    get transactionCalls() {
      return insertedRows.length > 0 ? 1 : 0;
    },
  };
};

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createNotificationPreferenceListDb = (rows: NotificationPreference[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.userId === recipientId)
              .sort(
                (left, right) =>
                  left.category.localeCompare(right.category) ||
                  left.channel.localeCompare(right.channel),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createUpdateOnlyDb = <T>(row: T): Database =>
  ({
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [row],
        }),
      }),
    }),
  }) as unknown as Database;

const createEmptyUpdateDb = (): Database =>
  ({
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    }),
  }) as unknown as Database;

const createUpdateConditionCaptureDb = <T>(row: T, capture: { condition: unknown }): Database =>
  ({
    update: () => ({
      set: () => ({
        where: (condition: unknown) => {
          capture.condition = condition;
          return {
            returning: async () => [row],
          };
        },
      }),
    }),
  }) as unknown as Database;

const getObjectProperty = (value: unknown, propertyName: string): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<PropertyKey, unknown>)[propertyName];
};

const collectSqlChunkColumnNames = (value: unknown, seen = new WeakSet<object>()): string[] => {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkColumnNames(chunk, seen));
  }

  const ownName = getObjectProperty(value, 'name');
  return typeof ownName === 'string' ? [ownName] : [];
};

describe('notification records', () => {
  it('stores tenant-scoped notification records', async () => {
    const rows: NotificationRecord[] = [];
    const saved = await saveNotification(createInsertOnlyDb(rows), notification);

    expect(saved).toEqual(notification);
    expect(rows).toEqual([notification]);
  });

  it('stores produced notifications and delivery events in one transaction', async () => {
    const transactional = createTransactionalInsertDb<NotificationRecord | OutboxEvent>();

    const saved = await saveProducedNotification(transactional.db, {
      notification,
      deliveryEvents: [notificationDeliveryEvent],
    });

    expect(saved.notification).toEqual(notification);
    expect(saved.deliveryEvents).toEqual([notificationDeliveryEvent]);
    expect(transactional.transactionCalls).toBe(1);
    expect(transactional.insertedRows).toEqual([notification, notificationDeliveryEvent]);
  });

  it('stores produced notification batches in one transaction', async () => {
    const transactional = createTransactionalInsertDb<NotificationRecord | OutboxEvent>();
    const secondNotification = NotificationRecord.parse({
      ...notification,
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      recipientId: '01J9QW7B6N5W2YH3D3A1V0KE34',
    });

    const saved = await saveProducedNotifications(transactional.db, [
      {
        notification,
        deliveryEvents: [notificationDeliveryEvent],
      },
      {
        notification: secondNotification,
        deliveryEvents: [],
      },
    ]);

    expect(saved).toEqual([
      {
        notification,
        deliveryEvents: [notificationDeliveryEvent],
      },
      {
        notification: secondNotification,
        deliveryEvents: [],
      },
    ]);
    expect(transactional.transactionCalls).toBe(1);
    expect(transactional.insertedRows).toEqual([
      notification,
      notificationDeliveryEvent,
      secondNotification,
    ]);
  });

  it('stores notification digest delivery ledger rows in one transaction', async () => {
    const transactional = createTransactionalInsertDb<Record<string, unknown>>();
    const deliveredAt = new Date('2026-05-10T02:00:00.000Z');

    await saveNotificationDigestDeliveries(transactional.db, {
      tenantId,
      recipientId,
      channel: 'email',
      frequency: 'daily_digest',
      notificationIds: [notification.id],
      deliveredAt,
    });

    expect(transactional.transactionCalls).toBe(1);
    expect(transactional.insertedRows).toEqual([
      expect.objectContaining({
        tenantId,
        recipientId,
        notificationId: notification.id,
        channel: 'email',
        frequency: 'daily_digest',
        deliveredAt,
        createdAt: deliveredAt,
      }),
    ]);
  });

  it('lists notifications for a tenant recipient', async () => {
    const listed = await listNotificationsForRecipient(
      createSelectOnlyDb([notification]),
      tenantId,
      recipientId,
    );

    expect(listed).toEqual([notification]);
  });

  it('lists notification preferences for a tenant user by category and channel', async () => {
    const earlierPreference = NotificationPreference.parse({
      ...notificationPreference,
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      category: 'feedback_published',
      channel: 'in_app',
      frequency: 'immediate',
    });
    const otherTenantPreference = NotificationPreference.parse({
      ...notificationPreference,
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE31',
    });

    const listed = await listNotificationPreferencesForUser(
      createNotificationPreferenceListDb([
        notificationPreference,
        otherTenantPreference,
        earlierPreference,
      ]),
      {
        tenantId,
        userId: recipientId,
      },
    );

    expect(listed).toEqual([earlierPreference, notificationPreference]);
  });

  it('marks notifications as read without changing delivery state', async () => {
    const readAt = new Date('2026-05-10T00:05:00.000Z');
    const updated = await markNotificationRead(
      createUpdateOnlyDb({ ...notification, readAt }),
      tenantId,
      notification.id,
      readAt,
    );

    expect(updated?.readAt).toEqual(readAt);
    expect(updated?.deliveryState).toBe('pending');
  });

  it('marks notifications read only for the authenticated recipient', async () => {
    const readAt = new Date('2026-05-10T00:05:00.000Z');
    const capture = { condition: null as unknown };

    const updated = await markNotificationReadForRecipient(
      createUpdateConditionCaptureDb({ ...notification, readAt }, capture),
      {
        tenantId,
        recipientId,
        notificationId: notification.id,
        readAt,
      },
    );

    expect(updated?.readAt).toEqual(readAt);
    expect(collectSqlChunkColumnNames(capture.condition)).toEqual(
      expect.arrayContaining(['tenant_id', 'recipient_id', 'id']),
    );
  });

  it('returns null when a notification cannot be marked read for the authenticated recipient', async () => {
    const updated = await markNotificationReadForRecipient(createEmptyUpdateDb(), {
      tenantId,
      recipientId,
      notificationId: notification.id,
      readAt: now,
    });

    expect(updated).toBeNull();
  });
});
