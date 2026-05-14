import { Lti1p3PlatformKey } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { buildLti1p3JsonWebKeySet } from '../src/lti/jwks.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';

describe('LTI 1.3 JWKS projection', () => {
  it('publishes only public JWK material from active platform keys', () => {
    const key = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
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

    expect(buildLti1p3JsonWebKeySet([key])).toEqual({
      keys: [key.publicJwk],
    });
  });
});
