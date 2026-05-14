import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  listNotificationPreferencesForUser: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listNotificationPreferencesForUser: coreMocks.listNotificationPreferencesForUser,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantAccess = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('notification preference API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listNotificationPreferencesForUser.mockResolvedValue([]);
    configureTenantAccess('student');
  });

  it('lists notification preferences for the signed-in tenant user', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.listNotificationPreferences(actorUserId, tenantId)).resolves.toEqual(
      [],
    );

    expect(coreMocks.listNotificationPreferencesForUser).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        userId: actorUserId,
      },
    );
  });

  it('rejects notification preferences outside tenant membership', async () => {
    configureTenantAccess(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listNotificationPreferences(actorUserId, tenantId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this tenant. Switch tenants or ask an administrator for access.',
    });

    expect(coreMocks.listNotificationPreferencesForUser).not.toHaveBeenCalled();
  });
});
