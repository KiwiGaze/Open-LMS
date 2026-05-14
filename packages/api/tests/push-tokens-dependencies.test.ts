import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserPushTokens: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  registerUserPushToken: vi.fn(),
  revokeUserPushToken: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserPushTokens: coreMocks.listUserPushTokens,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    registerUserPushToken: coreMocks.registerUserPushToken,
    revokeUserPushToken: coreMocks.revokeUserPushToken,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const tokenId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantMembership = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

const sampleToken = () => ({
  id: tokenId,
  tenantId,
  userId: actorUserId,
  platform: 'ios',
  token: 'sample-token',
  locale: 'en-US',
  appVersion: '1.0.0',
  lastUsedAt: now,
  createdAt: now,
  updatedAt: now,
});

const registerInput = {
  platform: 'ios' as const,
  token: 'sample-token',
  locale: 'en-US',
  appVersion: '1.0.0',
};

describe('push token API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.registerUserPushToken.mockResolvedValue(sampleToken());
    coreMocks.listUserPushTokens.mockResolvedValue([sampleToken()]);
    coreMocks.revokeUserPushToken.mockResolvedValue(true);
    configureTenantMembership('student');
  });

  it('lists tokens for an authenticated tenant member', async () => {
    const dependencies = createDependencies();

    const tokens = await dependencies.listMyPushTokens(actorUserId, tenantId);

    expect(tokens).toHaveLength(1);
    expect(coreMocks.listUserPushTokens).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: actorUserId,
    });
  });

  it('registers a token for the authenticated user', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.registerMyPushToken(actorUserId, tenantId, registerInput),
    ).resolves.toMatchObject({ id: tokenId, platform: 'ios' });

    expect(coreMocks.registerUserPushToken).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        userId: actorUserId,
        platform: 'ios',
        token: 'sample-token',
      }),
    );
  });

  it('revokes a token for the authenticated user', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.revokeMyPushToken(actorUserId, tenantId, tokenId),
    ).resolves.toBeUndefined();

    expect(coreMocks.revokeUserPushToken).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: actorUserId,
      tokenId,
    });
  });

  it('returns not_found when revoking a missing token', async () => {
    coreMocks.revokeUserPushToken.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.revokeMyPushToken(actorUserId, tenantId, tokenId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('rejects users not in the tenant', async () => {
    configureTenantMembership(null);
    const dependencies = createDependencies();

    await expect(dependencies.listMyPushTokens(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(coreMocks.listUserPushTokens).not.toHaveBeenCalled();
  });
});
