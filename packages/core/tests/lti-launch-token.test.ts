import { createPrivateKey, createPublicKey, createVerify, generateKeyPairSync } from 'node:crypto';
import {
  CourseExternalTool,
  IntegrationConnection,
  Lti1p3PlatformKey,
  type Lti1p3PublicJwk,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  createLti1p3DeepLinkingAuthorizationResponse,
  createLti1p3LaunchAuthorizationResponse,
} from '../src/lti/launch-token.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2S';
const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const toolId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE30';

const createKeyPair = (): { privateJwk: Record<string, unknown>; publicJwk: Lti1p3PublicJwk } => {
  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privateJwk = keyPair.privateKey.export({ format: 'jwk' }) as Record<string, unknown>;
  const publicJwk = keyPair.publicKey.export({ format: 'jwk' }) as Record<string, unknown>;

  if (
    typeof publicJwk.n !== 'string' ||
    typeof publicJwk.e !== 'string' ||
    typeof privateJwk.d !== 'string'
  ) {
    throw new Error('Generated RSA key pair did not include required JWK values.');
  }

  return {
    privateJwk,
    publicJwk: {
      kty: 'RSA',
      kid: 'platform-key-1',
      use: 'sig',
      alg: 'RS256',
      n: publicJwk.n,
      e: publicJwk.e,
    },
  };
};

const decodeJwtPart = (part: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;

const tool = CourseExternalTool.parse({
  id: toolId,
  tenantId,
  courseId,
  integrationConnectionId,
  name: 'Lab simulator',
  description: 'Launch the virtual science lab.',
  launchUrl: 'https://tools.example.edu/lti/launch/lab-simulator',
  placement: 'module_item' as const,
  status: 'active' as const,
  createdAt: now,
  updatedAt: now,
});

const connection = IntegrationConnection.parse({
  id: integrationConnectionId,
  tenantId,
  providerType: 'lti_1p3' as const,
  displayName: 'Lab simulator LTI',
  status: 'enabled' as const,
  config: {
    issuer: 'https://lms.example.edu',
    clientId: 'client-123',
    deploymentId: 'deployment-456',
    oidcLoginUrl: 'https://tools.example.edu/oidc/login',
    redirectUris: ['https://tools.example.edu/lti/launch'],
  },
  createdAt: now,
  updatedAt: now,
});

describe('LTI 1.3 launch authorization response', () => {
  it('creates a signed form-post id token with core LTI claims', () => {
    const { privateJwk, publicJwk } = createKeyPair();
    const platformKey = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId,
      keyId: 'platform-key-1',
      status: 'active',
      publicJwk,
      encryptedPrivateJwk:
        '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      createdAt: now,
      updatedAt: now,
    });

    const response = createLti1p3LaunchAuthorizationResponse({
      actorUserId,
      tenantId,
      courseId,
      tool,
      connection,
      platformKey,
      privateJwk,
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
      request: {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
      },
      now,
    });
    const [encodedHeader, encodedPayload, encodedSignature] = response.fields.id_token.split('.');
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    const signatureIsValid = verifier.verify(
      createPublicKey({ key: publicJwk, format: 'jwk' }),
      Buffer.from(encodedSignature ?? '', 'base64url'),
    );
    const header = decodeJwtPart(encodedHeader ?? '');
    const payload = decodeJwtPart(encodedPayload ?? '');

    expect(response).toMatchObject({
      method: 'form_post',
      url: 'https://tools.example.edu/lti/launch',
      fields: { state: 'state-123' },
    });
    expect(signatureIsValid).toBe(true);
    expect(header).toEqual({ alg: 'RS256', typ: 'JWT', kid: 'platform-key-1' });
    expect(payload).toMatchObject({
      iss: 'https://lms.example.edu',
      aud: 'client-123',
      sub: actorUserId,
      nonce: 'nonce-456',
      'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
      'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
      'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'deployment-456',
      'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': tool.launchUrl,
      'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
        id: tool.id,
        title: tool.name,
        description: tool.description,
      },
      'https://purl.imsglobal.org/spec/lti/claim/roles': [
        'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      ],
    });
    expect(payload.iat).toBe(Math.floor(now.getTime() / 1000));
    expect(payload.exp).toBe(Math.floor(now.getTime() / 1000) + 300);
  });

  it('creates a signed deep linking request without a resource link claim', () => {
    const { privateJwk, publicJwk } = createKeyPair();
    const platformKey = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId,
      keyId: 'platform-key-1',
      status: 'active',
      publicJwk,
      encryptedPrivateJwk:
        '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      createdAt: now,
      updatedAt: now,
    });

    const response = createLti1p3DeepLinkingAuthorizationResponse({
      actorUserId,
      tenantId,
      courseId,
      tool,
      connection,
      platformKey,
      privateJwk,
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'],
      request: {
        redirectUri: 'https://tools.example.edu/lti/launch',
        state: 'state-123',
        nonce: 'nonce-456',
        deepLinkReturnUrl: 'https://lms.example.edu/api/v1/lti-1p3/deep-linking/return',
      },
      data: 'eyJ0ZW5hbnRJZCI6IjAxSjlRVzdCNk41VzJZSDNEM0ExVjBLRTJUIn0',
      now,
    });
    const [encodedHeader, encodedPayload, encodedSignature] = response.fields.id_token.split('.');
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    const signatureIsValid = verifier.verify(
      createPublicKey({ key: publicJwk, format: 'jwk' }),
      Buffer.from(encodedSignature ?? '', 'base64url'),
    );
    const payload = decodeJwtPart(encodedPayload ?? '');

    expect(signatureIsValid).toBe(true);
    expect(response.url).toBe('https://tools.example.edu/lti/launch');
    expect(payload).toMatchObject({
      iss: 'https://lms.example.edu',
      aud: 'client-123',
      sub: actorUserId,
      nonce: 'nonce-456',
      'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
      'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
      'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'deployment-456',
      'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': tool.launchUrl,
      'https://purl.imsglobal.org/spec/lti/claim/roles': [
        'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
      ],
      'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
        deep_link_return_url: 'https://lms.example.edu/api/v1/lti-1p3/deep-linking/return',
        accept_types: ['ltiResourceLink'],
        accept_presentation_document_targets: ['iframe', 'window'],
        accept_multiple: true,
        data: 'eyJ0ZW5hbnRJZCI6IjAxSjlRVzdCNk41VzJZSDNEM0ExVjBLRTJUIn0',
      },
    });
    expect(payload).not.toHaveProperty('https://purl.imsglobal.org/spec/lti/claim/resource_link');
  });

  it('rejects redirect URIs that are not registered on the LTI connection', () => {
    const { privateJwk, publicJwk } = createKeyPair();
    const platformKey = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId,
      keyId: 'platform-key-1',
      status: 'active',
      publicJwk,
      encryptedPrivateJwk:
        '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      createdAt: now,
      updatedAt: now,
    });

    expect(() =>
      createLti1p3LaunchAuthorizationResponse({
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection,
        platformKey,
        privateJwk,
        roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
        request: {
          redirectUri: 'https://attacker.example.edu/lti/launch',
          state: 'state-123',
          nonce: 'nonce-456',
        },
        now,
      }),
    ).toThrow(/registered redirect URI/);
  });

  it('rejects private JWK material that does not match the public platform key', () => {
    const { privateJwk, publicJwk } = createKeyPair();
    const mismatchedKeyPair = createKeyPair();
    const platformKey = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId,
      keyId: 'platform-key-1',
      status: 'active',
      publicJwk: mismatchedKeyPair.publicJwk,
      encryptedPrivateJwk:
        '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      createdAt: now,
      updatedAt: now,
    });

    expect(() =>
      createLti1p3LaunchAuthorizationResponse({
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection,
        platformKey,
        privateJwk,
        roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
        request: {
          redirectUri: 'https://tools.example.edu/lti/launch',
          state: 'state-123',
          nonce: 'nonce-456',
        },
        now,
      }),
    ).toThrow(/must match the active public platform key/);

    expect(publicJwk.n).not.toBe(mismatchedKeyPair.publicJwk.n);
  });

  it('rejects an authorization client id that does not match the LTI connection', () => {
    const { privateJwk, publicJwk } = createKeyPair();
    const platformKey = Lti1p3PlatformKey.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId,
      keyId: 'platform-key-1',
      status: 'active',
      publicJwk,
      encryptedPrivateJwk:
        '{"ciphertextBase64":"encrypted","ivBase64":"AAAAAAAAAAAAAAAA","authTagBase64":"AAAAAAAAAAAAAAAAAAAAAA=="}',
      createdAt: now,
      updatedAt: now,
    });

    expect(() =>
      createLti1p3LaunchAuthorizationResponse({
        actorUserId,
        tenantId,
        courseId,
        tool,
        connection,
        platformKey,
        privateJwk,
        roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
        expectedClientId: 'wrong-client',
        request: {
          redirectUri: 'https://tools.example.edu/lti/launch',
          state: 'state-123',
          nonce: 'nonce-456',
        },
        now,
      }),
    ).toThrow(/client_id must match/);
  });
});
