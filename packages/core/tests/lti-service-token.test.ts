import { createPrivateKey, createSign, generateKeyPairSync } from 'node:crypto';
import {
  Lti1p3ConnectionConfig,
  type Lti1p3PlatformKey,
  Lti1p3PlatformKeyId,
  type Lti1p3PublicJwk,
  TenantId,
  lti1p3NamesRolesContextMembershipReadonlyScope,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  createLti1p3ServiceAccessToken,
  verifyLti1p3ServiceAccessToken,
} from '../src/lti/service-token.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE2T');
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const tokenUrl = 'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/lti-1p3/token';
const platformKeyId = Lti1p3PlatformKeyId.parse('01J9QW7B6N5W2YH3D3A1V0KE33');

const createRsaKeyPair = (
  kid: string,
): {
  privateJwk: Record<string, unknown>;
  publicJwk: Lti1p3PublicJwk;
} => {
  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privateJwk = keyPair.privateKey.export({ format: 'jwk' }) as Record<string, unknown>;
  const publicJwk = keyPair.publicKey.export({ format: 'jwk' }) as Record<string, unknown>;

  if (typeof publicJwk.n !== 'string' || typeof publicJwk.e !== 'string') {
    throw new Error('Generated RSA key pair did not include public JWK values.');
  }

  return {
    privateJwk: { ...privateJwk, kid, use: 'sig', alg: 'RS256' },
    publicJwk: {
      kty: 'RSA',
      kid,
      use: 'sig',
      alg: 'RS256',
      n: publicJwk.n,
      e: publicJwk.e,
    },
  };
};

const encodeJwtPart = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const createToolClientAssertion = (input: {
  privateJwk: Record<string, unknown>;
  kid: string;
  aud: string;
  iss?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}): string => {
  const issuedAt = input.iat ?? Math.floor(now.getTime() / 1000);
  const encodedHeader = encodeJwtPart({ alg: 'RS256', typ: 'JWT', kid: input.kid });
  const encodedPayload = encodeJwtPart({
    iss: input.iss ?? 'client-123',
    sub: input.sub ?? 'client-123',
    aud: input.aud,
    iat: issuedAt,
    exp: input.exp ?? issuedAt + 300,
    jti: 'assertion-123',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'deployment-456',
  });
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer
    .sign(createPrivateKey({ key: input.privateJwk, format: 'jwk' }))
    .toString('base64url');

  return `${signingInput}.${signature}`;
};

describe('LTI 1.3 service access tokens', () => {
  it('exchanges a tool client assertion for a scoped platform access token', () => {
    const toolKeys = createRsaKeyPair('tool-key-1');
    const platformKeys = createRsaKeyPair('platform-key-1');
    const config = Lti1p3ConnectionConfig.parse({
      issuer: 'https://lms.example.edu',
      clientId: 'client-123',
      deploymentId: 'deployment-456',
      oidcLoginUrl: 'https://tools.example.edu/oidc/login',
      redirectUris: ['https://tools.example.edu/lti/launch'],
      toolJwks: { keys: [toolKeys.publicJwk] },
    });
    const platformKey: Lti1p3PlatformKey = {
      id: platformKeyId,
      tenantId,
      keyId: platformKeys.publicJwk.kid,
      status: 'active',
      publicJwk: platformKeys.publicJwk,
      encryptedPrivateJwk: 'encrypted',
      createdAt: now,
      updatedAt: now,
    };
    const clientAssertion = createToolClientAssertion({
      privateJwk: toolKeys.privateJwk,
      kid: toolKeys.publicJwk.kid,
      aud: tokenUrl,
    });

    const response = createLti1p3ServiceAccessToken({
      tenantId,
      integrationConnectionId,
      tokenUrl,
      requestedScopes: [lti1p3NamesRolesContextMembershipReadonlyScope],
      clientAssertion,
      config,
      platformKey,
      privateJwk: platformKeys.privateJwk,
      now,
    });
    const verified = verifyLti1p3ServiceAccessToken({
      accessToken: response.access_token,
      expectedTenantId: tenantId,
      requiredScope: lti1p3NamesRolesContextMembershipReadonlyScope,
      platformKeys: [platformKeys.publicJwk],
      now,
    });

    expect(response).toMatchObject({
      token_type: 'bearer',
      expires_in: 3600,
      scope: lti1p3NamesRolesContextMembershipReadonlyScope,
    });
    expect(verified).toMatchObject({
      tenantId,
      integrationConnectionId,
      clientId: 'client-123',
      scopes: [lti1p3NamesRolesContextMembershipReadonlyScope],
    });
  });

  it('rejects client assertions signed by an untrusted tool key', () => {
    const trustedToolKeys = createRsaKeyPair('tool-key-1');
    const untrustedToolKeys = createRsaKeyPair('tool-key-2');
    const platformKeys = createRsaKeyPair('platform-key-1');
    const config = Lti1p3ConnectionConfig.parse({
      issuer: 'https://lms.example.edu',
      clientId: 'client-123',
      deploymentId: 'deployment-456',
      oidcLoginUrl: 'https://tools.example.edu/oidc/login',
      redirectUris: ['https://tools.example.edu/lti/launch'],
      toolJwks: { keys: [trustedToolKeys.publicJwk] },
    });
    const platformKey: Lti1p3PlatformKey = {
      id: platformKeyId,
      tenantId,
      keyId: platformKeys.publicJwk.kid,
      status: 'active',
      publicJwk: platformKeys.publicJwk,
      encryptedPrivateJwk: 'encrypted',
      createdAt: now,
      updatedAt: now,
    };

    expect(() =>
      createLti1p3ServiceAccessToken({
        tenantId,
        integrationConnectionId,
        tokenUrl,
        requestedScopes: [lti1p3NamesRolesContextMembershipReadonlyScope],
        clientAssertion: createToolClientAssertion({
          privateJwk: untrustedToolKeys.privateJwk,
          kid: untrustedToolKeys.publicJwk.kid,
          aud: tokenUrl,
        }),
        config,
        platformKey,
        privateJwk: platformKeys.privateJwk,
        now,
      }),
    ).toThrow(/not trusted/);
  });

  it('rejects long-lived tool client assertions', () => {
    const toolKeys = createRsaKeyPair('tool-key-1');
    const platformKeys = createRsaKeyPair('platform-key-1');
    const config = Lti1p3ConnectionConfig.parse({
      issuer: 'https://lms.example.edu',
      clientId: 'client-123',
      deploymentId: 'deployment-456',
      oidcLoginUrl: 'https://tools.example.edu/oidc/login',
      redirectUris: ['https://tools.example.edu/lti/launch'],
      toolJwks: { keys: [toolKeys.publicJwk] },
    });
    const platformKey: Lti1p3PlatformKey = {
      id: platformKeyId,
      tenantId,
      keyId: platformKeys.publicJwk.kid,
      status: 'active',
      publicJwk: platformKeys.publicJwk,
      encryptedPrivateJwk: 'encrypted',
      createdAt: now,
      updatedAt: now,
    };
    const issuedAt = Math.floor(now.getTime() / 1000);

    expect(() =>
      createLti1p3ServiceAccessToken({
        tenantId,
        integrationConnectionId,
        tokenUrl,
        requestedScopes: [lti1p3NamesRolesContextMembershipReadonlyScope],
        clientAssertion: createToolClientAssertion({
          privateJwk: toolKeys.privateJwk,
          kid: toolKeys.publicJwk.kid,
          aud: tokenUrl,
          iat: issuedAt,
          exp: issuedAt + 3600,
        }),
        config,
        platformKey,
        privateJwk: platformKeys.privateJwk,
        now,
      }),
    ).toThrow(/lifetime must not exceed five minutes/);
  });
});
