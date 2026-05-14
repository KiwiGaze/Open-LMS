import { createPrivateKey, createSign } from 'node:crypto';
import {
  type CourseExternalTool,
  type IntegrationConnection,
  Lti1p3ConnectionConfig,
  Lti1p3DeepLinkingLaunchRequest,
  type Lti1p3DeepLinkingLaunchRequest as Lti1p3DeepLinkingLaunchRequestContract,
  Lti1p3DeepLinkingSettings,
  Lti1p3LaunchAuthorizationRequest,
  type Lti1p3LaunchAuthorizationRequest as Lti1p3LaunchAuthorizationRequestContract,
  Lti1p3LaunchAuthorizationResponse,
  type Lti1p3LaunchAuthorizationResponse as Lti1p3LaunchAuthorizationResponseContract,
  type Lti1p3PlatformKey,
} from '@openlms/contracts';
import { z } from 'zod';
import { assertValidLti1p3LaunchContext } from './launch-context.ts';

const Base64UrlValue = z.string().regex(/^[A-Za-z0-9_-]+$/);

const Lti1p3PrivateJwk = z
  .object({
    kty: z.literal('RSA'),
    kid: z.string().min(1).max(255).optional(),
    use: z.literal('sig').optional(),
    alg: z.literal('RS256').optional(),
    n: Base64UrlValue,
    e: Base64UrlValue,
    d: Base64UrlValue,
    p: Base64UrlValue,
    q: Base64UrlValue,
    dp: Base64UrlValue,
    dq: Base64UrlValue,
    qi: Base64UrlValue,
  })
  .passthrough();
type Lti1p3PrivateJwk = z.infer<typeof Lti1p3PrivateJwk>;

const ltiMessageTypeClaim = 'https://purl.imsglobal.org/spec/lti/claim/message_type';
const ltiVersionClaim = 'https://purl.imsglobal.org/spec/lti/claim/version';
const ltiDeploymentIdClaim = 'https://purl.imsglobal.org/spec/lti/claim/deployment_id';
const ltiTargetLinkUriClaim = 'https://purl.imsglobal.org/spec/lti/claim/target_link_uri';
const ltiResourceLinkClaim = 'https://purl.imsglobal.org/spec/lti/claim/resource_link';
const ltiRolesClaim = 'https://purl.imsglobal.org/spec/lti/claim/roles';
const ltiDeepLinkingSettingsClaim =
  'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings';
const ltiNamesRolesServiceClaim = 'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice';

type BaseLti1p3LaunchAuthorizationResponseInput = {
  actorUserId: string;
  tenantId: string;
  courseId: string;
  tool: CourseExternalTool;
  connection: IntegrationConnection;
  platformKey: Lti1p3PlatformKey;
  privateJwk: unknown;
  roles: string[];
  expectedClientId?: string;
  namesRolesServiceUrl?: string;
  now?: Date;
};

type CreateLti1p3LaunchAuthorizationResponseInput = BaseLti1p3LaunchAuthorizationResponseInput & {
  request: Lti1p3LaunchAuthorizationRequestContract;
};

type CreateLti1p3DeepLinkingAuthorizationResponseInput =
  BaseLti1p3LaunchAuthorizationResponseInput & {
    request: Lti1p3DeepLinkingLaunchRequestContract;
    data: string;
  };

type BaseLti1p3LaunchClaims = {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  nonce: string;
  [ltiVersionClaim]: '1.3.0';
  [ltiDeploymentIdClaim]: string;
  [ltiTargetLinkUriClaim]: string;
  [ltiRolesClaim]: string[];
  [ltiNamesRolesServiceClaim]?: {
    context_memberships_url: string;
    service_versions: ['2.0'];
  };
};

type Lti1p3ResourceLinkLaunchClaims = BaseLti1p3LaunchClaims & {
  [ltiMessageTypeClaim]: 'LtiResourceLinkRequest';
  [ltiResourceLinkClaim]: {
    id: string;
    title: string;
    description?: string;
  };
};

type Lti1p3DeepLinkingLaunchClaims = BaseLti1p3LaunchClaims & {
  [ltiMessageTypeClaim]: 'LtiDeepLinkingRequest';
  [ltiDeepLinkingSettingsClaim]: Lti1p3DeepLinkingSettings;
};

type Lti1p3LaunchClaims = Lti1p3ResourceLinkLaunchClaims | Lti1p3DeepLinkingLaunchClaims;

const encodeJwtPart = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const createRs256Jwt = (input: {
  keyId: string;
  privateJwk: Lti1p3PrivateJwk;
  claims: Lti1p3LaunchClaims;
}): string => {
  const encodedHeader = encodeJwtPart({ alg: 'RS256', typ: 'JWT', kid: input.keyId });
  const encodedPayload = encodeJwtPart(input.claims);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer
    .sign(createPrivateKey({ key: input.privateJwk, format: 'jwk' }))
    .toString('base64url');

  return `${signingInput}.${signature}`;
};

const prepareLti1p3LaunchSigningContext = (
  input: BaseLti1p3LaunchAuthorizationResponseInput,
): { config: Lti1p3ConnectionConfig; privateJwk: Lti1p3PrivateJwk; issuedAtSeconds: number } => {
  assertValidLti1p3LaunchContext(input);

  if (input.platformKey.tenantId !== input.tenantId || input.platformKey.status !== 'active') {
    throw new Error('LTI launch requires an active platform signing key in the requested tenant.');
  }

  if (input.platformKey.publicJwk.kid !== input.platformKey.keyId) {
    throw new Error('LTI launch platform signing key has inconsistent key identifiers.');
  }

  const config = Lti1p3ConnectionConfig.parse(input.connection.config);

  if (input.expectedClientId !== undefined && input.expectedClientId !== config.clientId) {
    throw new Error('LTI OIDC authorization client_id must match the LTI connection client id.');
  }

  const privateJwk = Lti1p3PrivateJwk.parse(input.privateJwk);

  if (
    privateJwk.n !== input.platformKey.publicJwk.n ||
    privateJwk.e !== input.platformKey.publicJwk.e ||
    (privateJwk.kid !== undefined && privateJwk.kid !== input.platformKey.keyId)
  ) {
    throw new Error('LTI launch private signing key must match the active public platform key.');
  }

  const issuedAtSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);

  return { config, privateJwk, issuedAtSeconds };
};

const assertRegisteredRedirectUri = (config: Lti1p3ConnectionConfig, redirectUri: string): void => {
  if (!config.redirectUris.includes(redirectUri)) {
    throw new Error('LTI launch redirect URI must match a registered redirect URI.');
  }
};

export const createLti1p3LaunchAuthorizationResponse = (
  input: CreateLti1p3LaunchAuthorizationResponseInput,
): Lti1p3LaunchAuthorizationResponseContract => {
  const request = Lti1p3LaunchAuthorizationRequest.parse(input.request);
  const { config, privateJwk, issuedAtSeconds } = prepareLti1p3LaunchSigningContext(input);

  assertRegisteredRedirectUri(config, request.redirectUri);

  const resourceLink =
    input.tool.description === null
      ? { id: input.tool.id, title: input.tool.name }
      : { id: input.tool.id, title: input.tool.name, description: input.tool.description };
  const idToken = createRs256Jwt({
    keyId: input.platformKey.keyId,
    privateJwk,
    claims: {
      iss: config.issuer,
      aud: config.clientId,
      sub: input.actorUserId,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + 300,
      nonce: request.nonce,
      [ltiMessageTypeClaim]: 'LtiResourceLinkRequest',
      [ltiVersionClaim]: '1.3.0',
      [ltiDeploymentIdClaim]: config.deploymentId,
      [ltiTargetLinkUriClaim]: input.tool.launchUrl,
      [ltiResourceLinkClaim]: resourceLink,
      [ltiRolesClaim]: input.roles,
      ...(input.namesRolesServiceUrl
        ? {
            [ltiNamesRolesServiceClaim]: {
              context_memberships_url: input.namesRolesServiceUrl,
              service_versions: ['2.0'],
            },
          }
        : {}),
    },
  });

  return Lti1p3LaunchAuthorizationResponse.parse({
    method: 'form_post',
    url: request.redirectUri,
    fields: {
      id_token: idToken,
      state: request.state,
    },
  });
};

export const createLti1p3DeepLinkingAuthorizationResponse = (
  input: CreateLti1p3DeepLinkingAuthorizationResponseInput,
): Lti1p3LaunchAuthorizationResponseContract => {
  const request = Lti1p3DeepLinkingLaunchRequest.parse(input.request);
  const { config, privateJwk, issuedAtSeconds } = prepareLti1p3LaunchSigningContext(input);

  assertRegisteredRedirectUri(config, request.redirectUri);

  const deepLinkingSettings = Lti1p3DeepLinkingSettings.parse({
    deep_link_return_url: request.deepLinkReturnUrl,
    accept_types: ['ltiResourceLink'],
    accept_presentation_document_targets: ['iframe', 'window'],
    accept_multiple: true,
    data: input.data,
  });
  const idToken = createRs256Jwt({
    keyId: input.platformKey.keyId,
    privateJwk,
    claims: {
      iss: config.issuer,
      aud: config.clientId,
      sub: input.actorUserId,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + 300,
      nonce: request.nonce,
      [ltiMessageTypeClaim]: 'LtiDeepLinkingRequest',
      [ltiVersionClaim]: '1.3.0',
      [ltiDeploymentIdClaim]: config.deploymentId,
      [ltiTargetLinkUriClaim]: input.tool.launchUrl,
      [ltiRolesClaim]: input.roles,
      [ltiDeepLinkingSettingsClaim]: deepLinkingSettings,
    },
  });

  return Lti1p3LaunchAuthorizationResponse.parse({
    method: 'form_post',
    url: request.redirectUri,
    fields: {
      id_token: idToken,
      state: request.state,
    },
  });
};
