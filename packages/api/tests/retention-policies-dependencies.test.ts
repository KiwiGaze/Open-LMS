import { RetentionPolicy, type TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listRetentionPolicies: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  upsertRetentionPolicy: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listRetentionPolicies: coreMocks.listRetentionPolicies,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    upsertRetentionPolicy: coreMocks.upsertRetentionPolicy,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const policyId = '01J9QW7B6N5W2YH3D3A1V0KEF2';
const now = new Date('2026-05-14T00:00:00.000Z');

const policy = RetentionPolicy.parse({
  id: policyId,
  tenantId,
  targetType: 'deleted_user',
  retainDays: 365,
  createdAt: now,
  updatedAt: now,
});

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorTenantRole = (actorRole: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(
    actorRole ? [{ tenantId, userId: actorUserId, role: actorRole }] : [],
  );
};

describe('retention policy API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listRetentionPolicies.mockResolvedValue([policy]);
    coreMocks.upsertRetentionPolicy.mockResolvedValue(policy);
  });

  it('lists retention policies for institution admins', async () => {
    setActorTenantRole('institution_admin');
    const dependencies = createDependencies();

    await expect(dependencies.listRetentionPolicies(actorUserId, tenantId)).resolves.toEqual([
      policy,
    ]);

    expect(coreMocks.listRetentionPolicies).toHaveBeenCalledWith(coreMocks.dbHandle.db, tenantId);
  });

  it('upserts retention policies for institution admins', async () => {
    setActorTenantRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertRetentionPolicy(actorUserId, tenantId, 'deleted_user', {
        retainDays: 365,
      }),
    ).resolves.toEqual(policy);

    expect(coreMocks.upsertRetentionPolicy).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      targetType: 'deleted_user',
      retainDays: 365,
    });
  });

  it('rejects non-admin tenant members', async () => {
    setActorTenantRole('instructor');
    const dependencies = createDependencies();

    await expect(dependencies.listRetentionPolicies(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
    await expect(
      dependencies.upsertRetentionPolicy(actorUserId, tenantId, 'deleted_user', {
        retainDays: 365,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listRetentionPolicies).not.toHaveBeenCalled();
    expect(coreMocks.upsertRetentionPolicy).not.toHaveBeenCalled();
  });
});
