import { Tenant, type TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  buildTenantFileStorageQuotaChangedAuditLog: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getTenantById: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveAuditLog: vi.fn(),
  updateTenantFileStorageQuotas: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    buildTenantFileStorageQuotaChangedAuditLog:
      coreMocks.buildTenantFileStorageQuotaChangedAuditLog,
    createDbHandle: coreMocks.createDbHandle,
    getTenantById: coreMocks.getTenantById,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveAuditLog: coreMocks.saveAuditLog,
    updateTenantFileStorageQuotas: coreMocks.updateTenantFileStorageQuotas,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEQ0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEQ1';
const auditLogId = '01J9QW7B6N5W2YH3D3A1V0KEQ2';
const now = new Date('2026-05-14T00:00:00.000Z');

const previousTenant = Tenant.parse({
  id: tenantId,
  slug: 'writing-school',
  displayName: 'Writing School',
  storageByteLimit: null,
  defaultUserStorageByteLimit: 256,
  createdAt: now,
  updatedAt: now,
});

const updatedTenant = Tenant.parse({
  ...previousTenant,
  storageByteLimit: 1024,
  defaultUserStorageByteLimit: null,
});

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(
    role ? [{ tenantId, userId: actorUserId, role }] : [],
  );
};

describe('tenant file storage quota API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getTenantById.mockResolvedValue(previousTenant);
    coreMocks.updateTenantFileStorageQuotas.mockResolvedValue(updatedTenant);
    coreMocks.buildTenantFileStorageQuotaChangedAuditLog.mockReturnValue({
      id: auditLogId,
      tenantId,
      actorId: actorUserId,
      category: 'tenant',
      action: 'change_tenant_file_storage_quotas',
      resourceType: 'tenant',
      resourceId: tenantId,
      metadata: {
        previousStorageByteLimit: null,
        storageByteLimit: 1024,
        previousDefaultUserStorageByteLimit: 256,
        defaultUserStorageByteLimit: null,
        updatedAt: updatedTenant.updatedAt.toISOString(),
      },
      createdAt: now,
    });
    coreMocks.saveAuditLog.mockResolvedValue({});
  });

  it('updates file storage quotas for institution admins and audits changes', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantFileStorageQuotas(actorUserId, tenantId, {
        storageByteLimit: 1024,
        defaultUserStorageByteLimit: null,
      }),
    ).resolves.toEqual(updatedTenant);

    expect(coreMocks.updateTenantFileStorageQuotas).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      storageByteLimit: 1024,
      defaultUserStorageByteLimit: null,
    });
    expect(coreMocks.buildTenantFileStorageQuotaChangedAuditLog).toHaveBeenCalledWith({
      tenantId,
      actorId: actorUserId,
      previousStorageByteLimit: null,
      storageByteLimit: 1024,
      previousDefaultUserStorageByteLimit: 256,
      defaultUserStorageByteLimit: null,
      updatedAt: updatedTenant.updatedAt,
    });
    expect(coreMocks.saveAuditLog).toHaveBeenCalled();
  });

  it('does not write an audit log when quotas do not change', async () => {
    setActorRole('institution_admin');
    coreMocks.updateTenantFileStorageQuotas.mockResolvedValue(previousTenant);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantFileStorageQuotas(actorUserId, tenantId, {
        storageByteLimit: null,
        defaultUserStorageByteLimit: 256,
      }),
    ).resolves.toEqual(previousTenant);

    expect(coreMocks.saveAuditLog).not.toHaveBeenCalled();
  });

  it('rejects non-admin tenant members', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantFileStorageQuotas(actorUserId, tenantId, {
        storageByteLimit: 1024,
        defaultUserStorageByteLimit: null,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getTenantById).not.toHaveBeenCalled();
    expect(coreMocks.updateTenantFileStorageQuotas).not.toHaveBeenCalled();
  });

  it('returns not_found when the tenant does not exist', async () => {
    setActorRole('institution_admin');
    coreMocks.getTenantById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantFileStorageQuotas(actorUserId, tenantId, {
        storageByteLimit: 1024,
        defaultUserStorageByteLimit: null,
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.updateTenantFileStorageQuotas).not.toHaveBeenCalled();
  });
});
