import { z } from 'zod';
import { AuditLogId, OutboxEventId, TenantId, UserId } from './ids.ts';

export const AuditCategory = z.enum([
  'auth',
  'tenant',
  'ai_request',
  'ai_generation',
  'grade',
  'human_review',
  'publication',
  'policy',
]);
export type AuditCategory = z.infer<typeof AuditCategory>;

export const AuditLog = z.object({
  id: AuditLogId,
  tenantId: TenantId,
  actorId: UserId.nullable(),
  category: AuditCategory,
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  metadata: z.record(z.unknown()),
  createdAt: z.date(),
});
export type AuditLog = z.infer<typeof AuditLog>;

export const OutboxEvent = z.object({
  id: OutboxEventId,
  tenantId: TenantId,
  topic: z.string().min(1),
  eventType: z.string().min(1),
  schemaVersion: z.string().min(1).default('1'),
  payload: z.record(z.unknown()),
  occurredAt: z.date(),
  processedAt: z.date().nullable(),
});
export type OutboxEvent = z.infer<typeof OutboxEvent>;
