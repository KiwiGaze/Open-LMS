import { AuditLog, OutboxEvent } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  listAuditLogsForTenant,
  listPendingNotificationDeliveryEvents,
  listPendingOutboxEvents,
  markOutboxEventProcessed,
} from '../src/events/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const later = new Date('2026-05-10T00:01:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';

const createOutboxEvent = (id: string, occurredAt: Date, processedAt: Date | null) =>
  OutboxEvent.parse({
    id,
    tenantId,
    topic: 'assignment.feedback',
    eventType: 'ai.feedback_draft.generated',
    payload: { eventId: id },
    occurredAt,
    processedAt,
  });

const createAuditLog = (id: string, createdAt: Date) =>
  AuditLog.parse({
    id,
    tenantId,
    actorId: '01J9QW7B6N5W2YH3D3A1V0KE30',
    category: 'publication',
    action: 'publish_feedback',
    resourceType: 'published_feedback',
    resourceId: '01J9QW7B6N5W2YH3D3A1V0KE31',
    metadata: { source: 'manual' },
    createdAt,
  });

const createOutboxDb = (rows: OutboxEvent[]) =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () =>
              rows
                .filter((event) => event.processedAt === null)
                .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()),
          }),
        }),
      }),
    }),
    update: () => ({
      set: (value: { processedAt: Date }) => ({
        where: () => ({
          returning: async () => {
            const row = rows.find((event) => event.id === '01J9QW7B6N5W2YH3D3A1V0KE2V');
            if (!row) {
              return [];
            }

            row.processedAt = value.processedAt;
            return [row];
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createOutboxConditionCaptureDb = (rows: OutboxEvent[], capture: { condition: unknown }) =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          capture.condition = condition;
          return {
            orderBy: () => ({
              limit: async (limit: number) =>
                rows
                  .filter((event) => event.topic === 'notification.delivery')
                  .filter((event) => event.processedAt === null)
                  .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
                  .slice(0, limit),
            }),
          };
        },
      }),
    }),
  }) as unknown as Database;

const createAuditDb = (rows: AuditLog[]) =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: () => ({
            limit: async (limit: number) =>
              rows
                .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
                .slice(0, limit),
          }),
          condition,
        }),
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

describe('outbox event repository', () => {
  it('lists unprocessed outbox events in occurrence order', async () => {
    const rows = [
      createOutboxEvent('01J9QW7B6N5W2YH3D3A1V0KE2V', later, null),
      createOutboxEvent('01J9QW7B6N5W2YH3D3A1V0KE2W', now, null),
      createOutboxEvent('01J9QW7B6N5W2YH3D3A1V0KE2X', now, later),
    ];

    const pending = await listPendingOutboxEvents(createOutboxDb(rows), tenantId, 10);

    expect(pending.map((event) => event.id)).toEqual([
      '01J9QW7B6N5W2YH3D3A1V0KE2W',
      '01J9QW7B6N5W2YH3D3A1V0KE2V',
    ]);
  });

  it('marks an outbox event processed for idempotent consumer progress', async () => {
    const rows = [createOutboxEvent('01J9QW7B6N5W2YH3D3A1V0KE2V', now, null)];

    const processed = await markOutboxEventProcessed(
      createOutboxDb(rows),
      tenantId,
      '01J9QW7B6N5W2YH3D3A1V0KE2V',
      later,
    );

    expect(processed.processedAt).toEqual(later);
  });

  it('lists pending notification delivery events with a topic filter', async () => {
    const rows = [
      OutboxEvent.parse({
        ...createOutboxEvent('01J9QW7B6N5W2YH3D3A1V0KE2V', now, null),
        topic: 'assignment.lifecycle',
      }),
      OutboxEvent.parse({
        ...createOutboxEvent('01J9QW7B6N5W2YH3D3A1V0KE2W', later, null),
        topic: 'notification.delivery',
      }),
    ];
    const capture = { condition: null as unknown };

    const pending = await listPendingNotificationDeliveryEvents(
      createOutboxConditionCaptureDb(rows, capture),
      tenantId,
      1,
    );

    expect(pending.map((event) => event.id)).toEqual(['01J9QW7B6N5W2YH3D3A1V0KE2W']);
    expect(collectSqlChunkColumnNames(capture.condition)).toEqual(
      expect.arrayContaining(['tenant_id', 'topic', 'processed_at']),
    );
  });

  it('lists tenant-scoped audit logs for review and export access', async () => {
    const rows = [
      createAuditLog('01J9QW7B6N5W2YH3D3A1V0KE2V', now),
      createAuditLog('01J9QW7B6N5W2YH3D3A1V0KE2W', later),
    ];

    const logs = await listAuditLogsForTenant(createAuditDb(rows), { tenantId, limit: 10 });

    expect(logs.map((log) => log.id)).toEqual([
      '01J9QW7B6N5W2YH3D3A1V0KE2W',
      '01J9QW7B6N5W2YH3D3A1V0KE2V',
    ]);
  });

  it('adds audit log search filters to the tenant-scoped query', async () => {
    const capture = { condition: null as unknown };
    const db = {
      select: () => ({
        from: () => ({
          where: (condition: unknown) => {
            capture.condition = condition;
            return {
              orderBy: () => ({
                limit: async () => [],
              }),
            };
          },
        }),
      }),
    } as unknown as Database;

    await listAuditLogsForTenant(db, {
      tenantId,
      category: 'grade',
      action: 'change_grade',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      resourceType: 'grade',
      resourceId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      from: now,
      to: later,
      limit: 25,
    });

    expect(collectSqlChunkColumnNames(capture.condition)).toEqual(
      expect.arrayContaining([
        'tenant_id',
        'category',
        'action',
        'actor_id',
        'resource_type',
        'resource_id',
        'created_at',
      ]),
    );
  });
});
