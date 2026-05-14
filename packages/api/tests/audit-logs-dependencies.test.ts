import { AuditLog } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listAuditLogsForTenant: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listAuditLogsForTenant: coreMocks.listAuditLogsForTenant,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const auditLogId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const now = new Date('2026-05-14T00:00:00.000Z');

const auditLog = AuditLog.parse({
  id: auditLogId,
  tenantId,
  actorId: actorUserId,
  category: 'grade',
  action: 'change_grade',
  resourceType: 'grade',
  resourceId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  metadata: { changedFields: ['score'] },
  createdAt: now,
});

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

describe('audit log API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listAuditLogsForTenant.mockResolvedValue([auditLog]);
    coreMocks.listUserTenantMemberships.mockResolvedValue([
      { tenantId, userId: actorUserId, role: 'institution_admin' },
    ]);
  });

  it('lists tenant audit logs for actors with audit permission', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listAuditLogs(actorUserId, tenantId, {
        category: 'grade',
        action: 'change_grade',
        actorId: actorUserId,
        resourceType: 'grade',
        resourceId: auditLog.resourceId,
        from: now,
        to: now,
        limit: 25,
      }),
    ).resolves.toEqual([auditLog]);

    expect(coreMocks.listAuditLogsForTenant).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      category: 'grade',
      action: 'change_grade',
      actorId: actorUserId,
      resourceType: 'grade',
      resourceId: auditLog.resourceId,
      from: now,
      to: now,
      limit: 25,
    });
  });

  it('rejects actors without audit permission', async () => {
    coreMocks.listUserTenantMemberships.mockResolvedValue([
      { tenantId, userId: actorUserId, role: 'student' },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAuditLogs(actorUserId, tenantId, { limit: 25 }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listAuditLogsForTenant).not.toHaveBeenCalled();
  });

  it('exports matching audit logs as CSV', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.exportAuditLogsCsv(actorUserId, tenantId, { category: 'grade', limit: 25 }),
    ).resolves.toContain('id,tenant_id,actor_id,category,action');
  });
});
