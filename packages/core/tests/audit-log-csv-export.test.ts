import { AuditLog } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { serializeAuditLogsAsCsv } from '../src/exports/audit-log-csv-export.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const auditLogId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const now = new Date('2026-05-14T00:00:00.000Z');

describe('audit log CSV export', () => {
  it('serializes audit logs with escaped metadata JSON', () => {
    const log = AuditLog.parse({
      id: auditLogId,
      tenantId,
      actorId,
      category: 'grade',
      action: 'change_grade',
      resourceType: 'grade',
      resourceId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      metadata: { changedFields: ['score'], note: 'Needs "review"' },
      createdAt: now,
    });

    expect(serializeAuditLogsAsCsv([log])).toBe(
      [
        'id,tenant_id,actor_id,category,action,resource_type,resource_id,metadata,created_at',
        `${auditLogId},${tenantId},${actorId},grade,change_grade,grade,01J9QW7B6N5W2YH3D3A1V0KE32,"{""changedFields"":[""score""],""note"":""Needs \\""review\\""""}",2026-05-14T00:00:00.000Z`,
      ].join('\n'),
    );
  });
});
