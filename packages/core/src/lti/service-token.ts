import {
  type JsonWebKey,
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
} from 'node:crypto';
import {
  IntegrationConnectionId,
  type Lti1p3ConnectionConfig,
  type Lti1p3PlatformKey,
  type Lti1p3PublicJwk,
  Lti1p3ServiceAccessToken,
  type Lti1p3ServiceAccessToken as Lti1p3ServiceAccessTokenContract,
  Lti1p3ServiceScope,
  type Lti1p3ServiceScope as Lti1p3ServiceScopeContract,
  TenantId,
} from '@openlms/contracts';
import { z } from 'zod';

const ltiDeploymentIdClaim = 'https://purl.imsglobal.org/spec/lti/claim/deployment_id';
const openLmsTenantIdClaim = 'https://open-lms.local/lti/claim/tenant_id';
const openLmsIntegrationConnectionIdClaim =
  'https://open-lms.local/lti/claim/integration_connection_id';
const maxClientAssertionLifetimeSeconds = 300;

const JwtHeader = z
  .object({
    alg: z.literal('RS256'),
    kid: z.string().min(1).max(255),
  })
  .passthrough();

const JwtAudience = z.union([z.string(), z.string().array()]);

const ClientAssertionClaims = z
  .object({
    iss: z.string().min(1).max(255),
    sub: z.string().min(1).max(255),
    aud: JwtAudience,
    iat: z.number().int(),
    exp: z.number().int(),
    jti: z.string().min(1).max(1024),
    [ltiDeploymentIdClaim]: z.string().min(1).max(255),
  })
  .passthrough();

const AccessTokenClaims = z
  .object({
    iss: z.string().min(1).max(2048),
    sub: z.string().min(1).max(255),
    aud: z.literal('open-lms:lti-services'),
    iat: z.number().int(),
    exp: z.number().int(),
    scope: Lti1p3ServiceScope.array().min(1).max(20),
    [openLmsTenantIdClaim]: TenantId,
    [openLmsIntegrationConnectionIdClaim]: IntegrationConnectionId,
  })
  .strict();

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

export type Lti1p3VerifiedServiceAccessToken = {
  tenantId: string;
  integrationConnectionId: string;
  clientId: string;
  scopes: Lti1p3ServiceScopeContract[];
};

const splitJwt = (jwt: string): { header: string; payload: string; signature: string } => {
  const [header, payload, signature, extra] = jwt.split('.');

  if (!header || !payload || !signature || extra !== undefined) {
    throw new Error('LTI service JWT is malformed.');
  }

  return { header, payload, signature };
};

const decodeJwtPart = (part: string, label: string): unknown => {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as unknown;
  } catch {
    throw new Error(`LTI service JWT ${label} is malformed.`);
  }
};

const audienceContains = (audience: string | string[], expectedAudience: string): boolean =>
  Array.isArray(audience) ? audience.includes(expectedAudience) : audience === expectedAudience;

const verifyRs256Jwt = (input: {
  jwt: string;
  publicKeys: Lti1p3PublicJwk[];
  missingKeyMessage: string;
  invalidSignatureMessage: string;
}): { claims: unknown; keyId: string } => {
  const { header, payload, signature } = splitJwt(input.jwt);
  const parsedHeader = JwtHeader.parse(decodeJwtPart(header, 'header'));
  const publicJwk = input.publicKeys.find((key) => key.kid === parsedHeader.kid);

  if (!publicJwk) {
    throw new Error(input.missingKeyMessage);
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${header}.${payload}`);
  const signatureIsValid = verifier.verify(
    createPublicKey({ key: publicJwk as JsonWebKey, format: 'jwk' }),
    Buffer.from(signature, 'base64url'),
  );

  if (!signatureIsValid) {
    throw new Error(input.invalidSignatureMessage);
  }

  return { claims: decodeJwtPart(payload, 'payload'), keyId: parsedHeader.kid };
};

const createRs256Jwt = (input: {
  keyId: string;
  privateJwk: Lti1p3PrivateJwk;
  claims: z.infer<typeof AccessTokenClaims>;
}): string => {
  const encodedHeader = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: input.keyId }),
    'utf8',
  ).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(input.claims), 'utf8').toString('base64url');
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer
    .sign(createPrivateKey({ key: input.privateJwk as JsonWebKey, format: 'jwk' }))
    .toString('base64url');

  return `${signingInput}.${signature}`;
};

export const parseLti1p3ServiceScopes = (scope: string): Lti1p3ServiceScopeContract[] => {
  const scopes = scope
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (scopes.length === 0) {
    throw new Error('LTI service token request must include at least one scope.');
  }

  return scopes.map((value) => Lti1p3ServiceScope.parse(value));
};

export const extractLti1p3ServiceTokenClientId = (clientAssertion: string): string => {
  const { payload } = splitJwt(clientAssertion);
  const claims = ClientAssertionClaims.pick({
    iss: true,
    sub: true,
  }).parse(decodeJwtPart(payload, 'payload'));

  if (claims.iss !== claims.sub) {
    throw new Error('LTI service token client assertion issuer and subject must match.');
  }

  return claims.sub;
};

export const createLti1p3ServiceAccessToken = (input: {
  tenantId: string;
  integrationConnectionId: string;
  tokenUrl: string;
  requestedScopes: Lti1p3ServiceScopeContract[];
  clientAssertion: string;
  config: Lti1p3ConnectionConfig;
  platformKey: Lti1p3PlatformKey;
  privateJwk: unknown;
  now?: Date;
}): Lti1p3ServiceAccessTokenContract => {
  if (!input.config.toolJwks || input.config.toolJwks.keys.length === 0) {
    throw new Error('LTI tool public keys are not configured for service tokens.');
  }

  if (input.platformKey.tenantId !== input.tenantId || input.platformKey.status !== 'active') {
    throw new Error('LTI service token signing requires an active platform key in the tenant.');
  }

  const { claims } = verifyRs256Jwt({
    jwt: input.clientAssertion,
    publicKeys: input.config.toolJwks.keys,
    missingKeyMessage: 'LTI service token client assertion signing key is not trusted.',
    invalidSignatureMessage: 'LTI service token client assertion signature is invalid.',
  });
  const assertion = ClientAssertionClaims.parse(claims);
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);

  if (assertion.iss !== input.config.clientId || assertion.sub !== input.config.clientId) {
    throw new Error('LTI service token client assertion issuer and subject must match client id.');
  }

  if (!audienceContains(assertion.aud, input.tokenUrl)) {
    throw new Error('LTI service token client assertion audience must match the token endpoint.');
  }

  if (assertion[ltiDeploymentIdClaim] !== input.config.deploymentId) {
    throw new Error('LTI service token client assertion deployment id must match the connection.');
  }

  if (assertion.exp <= nowSeconds) {
    throw new Error('LTI service token client assertion has expired.');
  }

  if (
    assertion.iat > nowSeconds + maxClientAssertionLifetimeSeconds ||
    assertion.exp - assertion.iat > maxClientAssertionLifetimeSeconds
  ) {
    throw new Error('LTI service token client assertion lifetime must not exceed five minutes.');
  }

  const privateJwk = Lti1p3PrivateJwk.parse(input.privateJwk);

  if (
    privateJwk.n !== input.platformKey.publicJwk.n ||
    privateJwk.e !== input.platformKey.publicJwk.e ||
    (privateJwk.kid !== undefined && privateJwk.kid !== input.platformKey.keyId)
  ) {
    throw new Error('LTI service token private signing key must match the active platform key.');
  }

  const accessToken = createRs256Jwt({
    keyId: input.platformKey.keyId,
    privateJwk,
    claims: AccessTokenClaims.parse({
      iss: input.config.issuer,
      sub: input.config.clientId,
      aud: 'open-lms:lti-services',
      iat: nowSeconds,
      exp: nowSeconds + 3600,
      scope: input.requestedScopes,
      [openLmsTenantIdClaim]: input.tenantId,
      [openLmsIntegrationConnectionIdClaim]: input.integrationConnectionId,
    }),
  });

  return Lti1p3ServiceAccessToken.parse({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    scope: input.requestedScopes.join(' '),
  });
};

export const verifyLti1p3ServiceAccessToken = (input: {
  accessToken: string;
  expectedTenantId: string;
  requiredScope: Lti1p3ServiceScopeContract;
  platformKeys: Lti1p3PublicJwk[];
  now?: Date;
}): Lti1p3VerifiedServiceAccessToken => {
  const { claims } = verifyRs256Jwt({
    jwt: input.accessToken,
    publicKeys: input.platformKeys,
    missingKeyMessage: 'LTI service access token signing key is not trusted.',
    invalidSignatureMessage: 'LTI service access token signature is invalid.',
  });
  const token = AccessTokenClaims.parse(claims);
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);

  if (token.exp <= nowSeconds) {
    throw new Error('LTI service access token has expired. Request a new token and retry.');
  }

  if (token[openLmsTenantIdClaim] !== input.expectedTenantId) {
    throw new Error('LTI service access token tenant does not match the requested tenant.');
  }

  if (!token.scope.includes(input.requiredScope)) {
    throw new Error('LTI service access token does not include the required scope.');
  }

  return {
    tenantId: token[openLmsTenantIdClaim],
    integrationConnectionId: token[openLmsIntegrationConnectionIdClaim],
    clientId: token.sub,
    scopes: token.scope,
  };
};
