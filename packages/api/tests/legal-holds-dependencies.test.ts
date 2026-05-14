import { type TenantRole, UserLegalHold } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  createUserLegalHold: vi.fn(),
  listUserLegalHolds: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  releaseUserLegalHold: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createUserLegalHold: coreMocks.createUserLegalHold,
    listUserLegalHolds: coreMocks.listUserLegalHolds,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    releaseUserLegalHold: coreMocks.releaseUserLegalHold,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const targetUserId = '01J9QW7B6N5W2YH3D3A1V0KEF2';
const legalHoldId = '01J9QW7B6N5W2YH3D3A1V0KEF3';
const now = new Date('2026-05-14T00:00:00.000Z');

const legalHold = UserLegalHold.parse({
  id: legalHoldId,
  tenantId,
  userId: targetUserId,
  createdById: actorUserId,
  reason: 'Grade appeal retention',
  releasedAt: null,
  createdAt: now,
  updatedAt: now,
});

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setTenantMemberships = ({
  actorRole,
  targetIsMember = true,
}: {
  actorRole: TenantRole | null;
  targetIsMember?: boolean;
}): void => {
  coreMocks.listUserTenantMemberships.mockImplementation(
    async (_db: unknown, requestedUserId: string) => {
      if (requestedUserId === actorUserId) {
        return actorRole ? [{ tenantId, userId: actorUserId, role: actorRole }] : [];
      }

      if (requestedUserId === targetUserId) {
        return targetIsMember ? [{ tenantId, userId: targetUserId, role: 'student' }] : [];
      }

      return [];
    },
  );
};

describe('legal hold API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createUserLegalHold.mockResolvedValue(legalHold);
    coreMocks.listUserLegalHolds.mockResolvedValue([legalHold]);
    coreMocks.releaseUserLegalHold.mockResolvedValue({ ...legalHold, releasedAt: now });
  });

  it('lists legal holds for institution admins', async () => {
    setTenantMemberships({ actorRole: 'institution_admin' });
    const dependencies = createDependencies();

    await expect(
      dependencies.listUserLegalHolds(actorUserId, tenantId, {
        userId: targetUserId,
        status: 'active',
      }),
    ).resolves.toEqual([legalHold]);

    expect(coreMocks.listUserLegalHolds).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: targetUserId,
      status: 'active',
    });
  });

  it('creates legal holds for institution admins', async () => {
    setTenantMemberships({ actorRole: 'institution_admin' });
    const dependencies = createDependencies();

    await expect(
      dependencies.createUserLegalHold(actorUserId, tenantId, {
        userId: targetUserId,
        reason: 'Grade appeal retention',
      }),
    ).resolves.toEqual(legalHold);

    expect(coreMocks.createUserLegalHold).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: targetUserId,
      createdById: actorUserId,
      reason: 'Grade appeal retention',
    });
  });

  it('releases legal holds for institution admins', async () => {
    setTenantMemberships({ actorRole: 'institution_admin' });
    const dependencies = createDependencies();

    await expect(
      dependencies.releaseUserLegalHold(actorUserId, tenantId, legalHoldId),
    ).resolves.toMatchObject({
      id: legalHoldId,
      releasedAt: now,
    });

    expect(coreMocks.releaseUserLegalHold).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      legalHoldId,
    });
  });

  it('rejects non-admin tenant members', async () => {
    setTenantMemberships({ actorRole: 'instructor' });
    const dependencies = createDependencies();

    await expect(
      dependencies.createUserLegalHold(actorUserId, tenantId, {
        userId: targetUserId,
        reason: 'Grade appeal retention',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.createUserLegalHold).not.toHaveBeenCalled();
  });

  it('rejects legal holds for users outside the tenant', async () => {
    setTenantMemberships({ actorRole: 'institution_admin', targetIsMember: false });
    const dependencies = createDependencies();

    await expect(
      dependencies.createUserLegalHold(actorUserId, tenantId, {
        userId: targetUserId,
        reason: 'Grade appeal retention',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.createUserLegalHold).not.toHaveBeenCalled();
  });

  it('returns conflict when an active hold already exists for the tenant user', async () => {
    setTenantMemberships({ actorRole: 'institution_admin' });
    coreMocks.createUserLegalHold.mockRejectedValue({
      code: '23505',
      constraint_name: 'user_legal_hold_active_user_tenant_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createUserLegalHold(actorUserId, tenantId, {
        userId: targetUserId,
        reason: 'Grade appeal retention',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('returns not found when releasing a missing or already released hold', async () => {
    setTenantMemberships({ actorRole: 'institution_admin' });
    coreMocks.releaseUserLegalHold.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.releaseUserLegalHold(actorUserId, tenantId, legalHoldId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
