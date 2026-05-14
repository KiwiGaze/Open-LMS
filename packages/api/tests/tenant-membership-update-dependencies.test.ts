import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  buildTenantMembershipRoleChangedAuditLog: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getTenantMembershipById: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveAuditLog: vi.fn(),
  updateTenantMembership: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    buildTenantMembershipRoleChangedAuditLog: coreMocks.buildTenantMembershipRoleChangedAuditLog,
    createDbHandle: coreMocks.createDbHandle,
    getTenantMembershipById: coreMocks.getTenantMembershipById,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveAuditLog: coreMocks.saveAuditLog,
    updateTenantMembership: coreMocks.updateTenantMembership,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEE0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEE1';
const membershipId = '01J9QW7B6N5W2YH3D3A1V0KEE2';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('tenant membership update API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getTenantMembershipById.mockResolvedValue({
      id: membershipId,
      tenantId,
      userId: actorUserId,
      role: 'student',
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.updateTenantMembership.mockResolvedValue({
      id: membershipId,
      tenantId,
      userId: actorUserId,
      role: 'instructor',
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.buildTenantMembershipRoleChangedAuditLog.mockReturnValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KEE3',
      tenantId,
      actorId: actorUserId,
      category: 'tenant',
      action: 'change_tenant_membership_role',
      resourceType: 'tenant_membership',
      resourceId: membershipId,
      metadata: {
        targetUserId: actorUserId,
        previousRole: 'student',
        role: 'instructor',
        updatedAt: now.toISOString(),
      },
      createdAt: now,
    });
    coreMocks.saveAuditLog.mockResolvedValue({});
  });

  it('updates a membership role for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantMembership(actorUserId, tenantId, membershipId, {
        role: 'instructor',
      }),
    ).resolves.toMatchObject({ id: membershipId, role: 'instructor' });

    expect(coreMocks.updateTenantMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      membershipId,
      role: 'instructor',
    });
    expect(coreMocks.buildTenantMembershipRoleChangedAuditLog).toHaveBeenCalledWith({
      tenantId,
      actorId: actorUserId,
      membershipId,
      targetUserId: actorUserId,
      previousRole: 'student',
      role: 'instructor',
      updatedAt: now,
    });
    expect(coreMocks.saveAuditLog).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      id: '01J9QW7B6N5W2YH3D3A1V0KEE3',
      tenantId,
      actorId: actorUserId,
      category: 'tenant',
      action: 'change_tenant_membership_role',
      resourceType: 'tenant_membership',
      resourceId: membershipId,
      metadata: {
        targetUserId: actorUserId,
        previousRole: 'student',
        role: 'instructor',
        updatedAt: now.toISOString(),
      },
      createdAt: now,
    });
  });

  it('does not write an audit log when the role does not change', async () => {
    setActorRole('institution_admin');
    coreMocks.getTenantMembershipById.mockResolvedValue({
      id: membershipId,
      tenantId,
      userId: actorUserId,
      role: 'instructor',
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantMembership(actorUserId, tenantId, membershipId, {
        role: 'instructor',
      }),
    ).resolves.toMatchObject({ id: membershipId, role: 'instructor' });

    expect(coreMocks.saveAuditLog).not.toHaveBeenCalled();
  });

  it('rejects instructors with forbidden', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantMembership(actorUserId, tenantId, membershipId, {
        role: 'instructor',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getTenantMembershipById).not.toHaveBeenCalled();
    expect(coreMocks.updateTenantMembership).not.toHaveBeenCalled();
  });

  it('returns conflict when the user already has the requested role', async () => {
    setActorRole('institution_admin');
    coreMocks.updateTenantMembership.mockRejectedValue({
      code: '23505',
      constraint_name: 'tenant_membership_tenant_user_role_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantMembership(actorUserId, tenantId, membershipId, {
        role: 'instructor',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('returns not_found when the membership does not exist', async () => {
    setActorRole('institution_admin');
    coreMocks.getTenantMembershipById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateTenantMembership(actorUserId, tenantId, membershipId, {
        role: 'instructor',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
    expect(coreMocks.updateTenantMembership).not.toHaveBeenCalled();
    expect(coreMocks.saveAuditLog).not.toHaveBeenCalled();
  });
});
