import {
  type AuditCategory,
  AuditLog,
  type AuditLog as AuditLogContract,
  OutboxEvent,
  type OutboxEvent as OutboxEventContract,
  OutboxEventId,
  TenantId,
} from '@openlms/contracts';
import { and, asc, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import { auditLog, outboxEvent } from '../db/schema/audit.ts';

export const saveAuditLog = async (
  db: Database,
  value: AuditLogContract,
): Promise<AuditLogContract> => {
  const parsed = AuditLog.parse(value);
  const [row] = await db.insert(auditLog).values(parsed).returning();

  if (!row) {
    throw new Error('Audit log could not be saved because the database returned no row.');
  }

  return AuditLog.parse(row);
};

export type ListAuditLogsForTenantInput = {
  tenantId: string;
  category?: AuditCategory;
  action?: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  from?: Date;
  to?: Date;
  limit: number;
};

export const listAuditLogsForTenant = async (
  db: Database,
  input: ListAuditLogsForTenantInput,
): Promise<AuditLogContract[]> => {
  const conditions = [eq(auditLog.tenantId, TenantId.parse(input.tenantId))];

  if (input.category !== undefined) {
    conditions.push(eq(auditLog.category, input.category));
  }

  if (input.action !== undefined) {
    conditions.push(eq(auditLog.action, input.action));
  }

  if (input.actorId !== undefined) {
    conditions.push(eq(auditLog.actorId, input.actorId));
  }

  if (input.resourceType !== undefined) {
    conditions.push(eq(auditLog.resourceType, input.resourceType));
  }

  if (input.resourceId !== undefined) {
    conditions.push(eq(auditLog.resourceId, input.resourceId));
  }

  if (input.from !== undefined) {
    conditions.push(gte(auditLog.createdAt, input.from));
  }

  if (input.to !== undefined) {
    conditions.push(lte(auditLog.createdAt, input.to));
  }

  const rows = await db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.createdAt))
    .limit(input.limit);

  return rows.map((row) => AuditLog.parse(row));
};

export const saveOutboxEvent = async (
  db: DatabaseExecutor,
  value: OutboxEventContract,
): Promise<OutboxEventContract> => {
  const parsed = OutboxEvent.parse(value);
  const [row] = await db.insert(outboxEvent).values(parsed).returning();

  if (!row) {
    throw new Error('Outbox event could not be saved because the database returned no row.');
  }

  return OutboxEvent.parse(row);
};

export const listPendingOutboxEvents = async (
  db: Database,
  tenantId: string,
  limit: number,
): Promise<OutboxEventContract[]> => {
  const rows = await db
    .select()
    .from(outboxEvent)
    .where(and(eq(outboxEvent.tenantId, TenantId.parse(tenantId)), isNull(outboxEvent.processedAt)))
    .orderBy(asc(outboxEvent.occurredAt))
    .limit(limit);

  return rows.map((row) => OutboxEvent.parse(row));
};

export const listPendingOutboxEventsByTopic = async (
  db: Database,
  tenantId: string,
  topic: string,
  limit: number,
): Promise<OutboxEventContract[]> => {
  const rows = await db
    .select()
    .from(outboxEvent)
    .where(
      and(
        eq(outboxEvent.tenantId, TenantId.parse(tenantId)),
        eq(outboxEvent.topic, topic),
        isNull(outboxEvent.processedAt),
      ),
    )
    .orderBy(asc(outboxEvent.occurredAt))
    .limit(limit);

  return rows.map((row) => OutboxEvent.parse(row));
};

export const listPendingNotificationDeliveryEvents = async (
  db: Database,
  tenantId: string,
  limit: number,
): Promise<OutboxEventContract[]> =>
  listPendingOutboxEventsByTopic(db, tenantId, 'notification.delivery', limit);

export const markOutboxEventProcessed = async (
  db: Database,
  tenantId: string,
  eventId: string,
  processedAt: Date,
): Promise<OutboxEventContract> => {
  const [row] = await db
    .update(outboxEvent)
    .set({ processedAt })
    .where(
      and(
        eq(outboxEvent.tenantId, TenantId.parse(tenantId)),
        eq(outboxEvent.id, OutboxEventId.parse(eventId)),
      ),
    )
    .returning();

  if (!row) {
    throw new Error('Outbox event was not found. Refresh event state and retry.');
  }

  return OutboxEvent.parse(row);
};
