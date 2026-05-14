import { createPrivateKey, createSign, generateKeyPairSync } from 'node:crypto';
import {
  Lti1p3ConnectionConfig,
  Lti1p3DeepLinkingSessionId,
  type Lti1p3PublicJwk,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  encodeLti1p3DeepLinkingSessionData,
  verifyLti1p3DeepLinkingReturn,
} from '../src/lti/deep-linking-return.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const sessionId = Lti1p3DeepLinkingSessionId.parse('01J9QW7B6N5W2YH3D3A1V0KE34');

const createToolKeyPair = (): {
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
    privateJwk,
    publicJwk: {
      kty: 'RSA',
      kid: 'tool-key-1',
      use: 'sig',
      alg: 'RS256',
      n: publicJwk.n,
      e: publicJwk.e,
    },
  };
};

const encodeJwtPart = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const createToolJwt = (input: {
  privateJwk: Record<string, unknown>;
  data: string;
  contentItems: unknown[];
  exp?: number;
}): string => {
  const encodedHeader = encodeJwtPart({ alg: 'RS256', typ: 'JWT', kid: 'tool-key-1' });
  const encodedPayload = encodeJwtPart({
    iss: 'client-123',
    aud: 'https://lms.example.edu',
    exp: input.exp ?? Math.floor(now.getTime() / 1000) + 300,
    iat: Math.floor(now.getTime() / 1000),
    nonce: 'nonce-123',
    azp: 'client-123',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'deployment-456',
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingResponse',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': input.contentItems,
    'https://purl.imsglobal.org/spec/lti-dl/claim/data': input.data,
  });
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer
    .sign(createPrivateKey({ key: input.privateJwk, format: 'jwk' }))
    .toString('base64url');

  return `${signingInput}.${signature}`;
};

describe('LTI 1.3 deep linking return verification', () => {
  it('verifies a tool-signed deep linking response and extracts LTI resource links', () => {
    const { privateJwk, publicJwk } = createToolKeyPair();
    const data = encodeLti1p3DeepLinkingSessionData({ sessionId });
    const config = Lti1p3ConnectionConfig.parse({
      issuer: 'https://lms.example.edu',
      clientId: 'client-123',
      deploymentId: 'deployment-456',
      oidcLoginUrl: 'https://tools.example.edu/oidc/login',
      redirectUris: ['https://tools.example.edu/lti/launch'],
      toolJwks: { keys: [publicJwk] },
    });
    const jwt = createToolJwt({
      privateJwk,
      data,
      contentItems: [
        {
          type: 'ltiResourceLink',
          title: 'Chapter 12 quiz',
          text: 'External quiz activity.',
          url: 'https://tools.example.edu/lti/launch/chapter-12',
        },
      ],
    });

    const result = verifyLti1p3DeepLinkingReturn({
      jwt,
      config,
      expectedData: data,
      now,
    });

    expect(result.sessionData.sessionId).toBe(sessionId);
    expect(result.contentItems).toEqual([
      {
        type: 'ltiResourceLink',
        title: 'Chapter 12 quiz',
        text: 'External quiz activity.',
        url: 'https://tools.example.edu/lti/launch/chapter-12',
      },
    ]);
  });

  it('rejects a deep linking response when the opaque data does not match the request', () => {
    const { privateJwk, publicJwk } = createToolKeyPair();
    const config = Lti1p3ConnectionConfig.parse({
      issuer: 'https://lms.example.edu',
      clientId: 'client-123',
      deploymentId: 'deployment-456',
      oidcLoginUrl: 'https://tools.example.edu/oidc/login',
      redirectUris: ['https://tools.example.edu/lti/launch'],
      toolJwks: { keys: [publicJwk] },
    });
    const jwt = createToolJwt({
      privateJwk,
      data: encodeLti1p3DeepLinkingSessionData({ sessionId }),
      contentItems: [],
    });

    expect(() =>
      verifyLti1p3DeepLinkingReturn({
        jwt,
        config,
        expectedData: encodeLti1p3DeepLinkingSessionData({
          sessionId: Lti1p3DeepLinkingSessionId.parse('01J9QW7B6N5W2YH3D3A1V0KE35'),
        }),
        now,
      }),
    ).toThrow(/must match the original deep linking request/);
  });
});
