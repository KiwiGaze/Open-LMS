import { TenantFeatureFlag, type TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteTenantFeatureFlag: vi.fn(),
  listTenantFeatureFlags: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  upsertTenantFeatureFlag: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteTenantFeatureFlag: coreMocks.deleteTenantFeatureFlag,
    listTenantFeatureFlags: coreMocks.listTenantFeatureFlags,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    upsertTenantFeatureFlag: coreMocks.upsertTenantFeatureFlag,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const featureFlagId = '01J9QW7B6N5W2YH3D3A1V0KEF2';
const now = new Date('2026-05-14T00:00:00.000Z');

const flag = TenantFeatureFlag.parse({
  id: featureFlagId,
  tenantId,
  key: 'gradebook.final_grades',
  enabled: true,
  description: 'Enable final grade exports for pilot tenants.',
  createdAt: now,
  updatedAt: now,
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

describe('tenant feature flag API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listTenantFeatureFlags.mockResolvedValue([flag]);
    coreMocks.upsertTenantFeatureFlag.mockResolvedValue(flag);
    coreMocks.deleteTenantFeatureFlag.mockResolvedValue(true);
  });

  it('lists feature flags for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(dependencies.listTenantFeatureFlags(actorUserId, tenantId)).resolves.toEqual([
      flag,
    ]);
  });

  it('upserts feature flags for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertTenantFeatureFlag(actorUserId, tenantId, 'gradebook.final_grades', {
        enabled: true,
        description: 'Enable final grade exports for pilot tenants.',
      }),
    ).resolves.toEqual(flag);

    expect(coreMocks.upsertTenantFeatureFlag).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      key: 'gradebook.final_grades',
      enabled: true,
      description: 'Enable final grade exports for pilot tenants.',
    });
  });

  it('deletes feature flags for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteTenantFeatureFlag(actorUserId, tenantId, 'gradebook.final_grades'),
    ).resolves.toBeUndefined();
  });

  it('rejects non-admin tenant members', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(dependencies.listTenantFeatureFlags(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
    expect(coreMocks.listTenantFeatureFlags).not.toHaveBeenCalled();
  });
});
