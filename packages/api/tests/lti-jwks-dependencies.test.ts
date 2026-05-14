import { Lti1p3PlatformKey } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  listActiveLti1p3PlatformKeys: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listActiveLti1p3PlatformKeys: coreMocks.listActiveLti1p3PlatformKeys,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const now = new Date('2026-05-10T00:00:00.000Z');

const platformKey = Lti1p3PlatformKey.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE86',
  tenantId,
  keyId: 'platform-key-1',
  status: 'active',
  publicJwk: {
    kty: 'RSA',
    kid: 'platform-key-1',
    use: 'sig',
    alg: 'RS256',
    n: 'sXch3n91Z0-SKpR6aSpsNQ',
    e: 'AQAB',
  },
  encryptedPrivateJwk:
    '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
  createdAt: now,
  updatedAt: now,
});

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

describe('LTI 1.3 JWKS API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listActiveLti1p3PlatformKeys.mockResolvedValue([platformKey]);
  });

  it('returns the active tenant platform public keys as JWKS', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.getLti1p3JsonWebKeySet(tenantId)).resolves.toEqual({
      keys: [platformKey.publicJwk],
    });

    expect(coreMocks.listActiveLti1p3PlatformKeys).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
    );
  });
});
