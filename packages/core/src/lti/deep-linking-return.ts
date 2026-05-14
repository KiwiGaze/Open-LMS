import { createPublicKey, createVerify } from 'node:crypto';
import {
  type Lti1p3ConnectionConfig,
  Lti1p3DeepLinkingContentItem,
  type Lti1p3DeepLinkingContentItem as Lti1p3DeepLinkingContentItemContract,
  Lti1p3DeepLinkingSessionData,
  type Lti1p3DeepLinkingSessionData as Lti1p3DeepLinkingSessionDataContract,
} from '@openlms/contracts';
import { z } from 'zod';

const ltiMessageTypeClaim = 'https://purl.imsglobal.org/spec/lti/claim/message_type';
const ltiVersionClaim = 'https://purl.imsglobal.org/spec/lti/claim/version';
const ltiDeploymentIdClaim = 'https://purl.imsglobal.org/spec/lti/claim/deployment_id';
const ltiDeepLinkingContentItemsClaim =
  'https://purl.imsglobal.org/spec/lti-dl/claim/content_items';
const ltiDeepLinkingDataClaim = 'https://purl.imsglobal.org/spec/lti-dl/claim/data';

const Lti1p3DeepLinkingReturnJwtHeader = z
  .object({
    alg: z.literal('RS256'),
    kid: z.string().min(1).max(255),
  })
  .passthrough();

const JwtAudience = z.union([z.string(), z.string().array()]);

const Lti1p3DeepLinkingReturnJwtClaims = z
  .object({
    iss: z.string().min(1).max(255),
    aud: JwtAudience,
    azp: z.string().min(1).max(255).optional(),
    exp: z.number().int(),
    iat: z.number().int().optional(),
    nonce: z.string().min(1).max(1024).optional(),
    [ltiDeploymentIdClaim]: z.string().min(1).max(255),
    [ltiMessageTypeClaim]: z.literal('LtiDeepLinkingResponse'),
    [ltiVersionClaim]: z.literal('1.3.0'),
    [ltiDeepLinkingContentItemsClaim]: Lti1p3DeepLinkingContentItem.array().max(20),
    [ltiDeepLinkingDataClaim]: z.string().min(1).max(4096),
  })
  .passthrough();

export type VerifiedLti1p3DeepLinkingReturn = {
  sessionData: Lti1p3DeepLinkingSessionDataContract;
  contentItems: Lti1p3DeepLinkingContentItemContract[];
};

const decodeJwtPart = (part: string, label: string): unknown => {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as unknown;
  } catch {
    throw new Error(`LTI deep linking return ${label} is malformed.`);
  }
};

const splitJwt = (jwt: string): { header: string; payload: string; signature: string } => {
  const [header, payload, signature, extra] = jwt.split('.');

  if (!header || !payload || !signature || extra !== undefined) {
    throw new Error('LTI deep linking return JWT is malformed.');
  }

  return { header, payload, signature };
};

const audienceContains = (audience: string | string[], expectedAudience: string): boolean =>
  Array.isArray(audience) ? audience.includes(expectedAudience) : audience === expectedAudience;

export const encodeLti1p3DeepLinkingSessionData = (
  value: Lti1p3DeepLinkingSessionDataContract,
): string =>
  Buffer.from(JSON.stringify(Lti1p3DeepLinkingSessionData.parse(value)), 'utf8').toString(
    'base64url',
  );

export const decodeLti1p3DeepLinkingSessionData = (
  value: string,
): Lti1p3DeepLinkingSessionDataContract => {
  try {
    return Lti1p3DeepLinkingSessionData.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown,
    );
  } catch {
    throw new Error('LTI deep linking session data is malformed. Start deep linking again.');
  }
};

export const extractLti1p3DeepLinkingReturnSessionData = (
  jwt: string,
): Lti1p3DeepLinkingSessionDataContract => {
  const { payload } = splitJwt(jwt);
  const claims = Lti1p3DeepLinkingReturnJwtClaims.pick({
    [ltiDeepLinkingDataClaim]: true,
  }).parse(decodeJwtPart(payload, 'payload'));

  return decodeLti1p3DeepLinkingSessionData(claims[ltiDeepLinkingDataClaim]);
};

export const verifyLti1p3DeepLinkingReturn = (input: {
  jwt: string;
  config: Lti1p3ConnectionConfig;
  expectedData: string;
  now?: Date;
}): VerifiedLti1p3DeepLinkingReturn => {
  if (!input.config.toolJwks || input.config.toolJwks.keys.length === 0) {
    throw new Error('LTI tool public keys are not configured for deep linking returns.');
  }

  const { header, payload, signature } = splitJwt(input.jwt);
  const parsedHeader = Lti1p3DeepLinkingReturnJwtHeader.parse(decodeJwtPart(header, 'header'));
  const publicJwk = input.config.toolJwks.keys.find((key) => key.kid === parsedHeader.kid);

  if (!publicJwk) {
    throw new Error('LTI deep linking return signing key is not trusted.');
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${header}.${payload}`);
  const signatureIsValid = verifier.verify(
    createPublicKey({ key: publicJwk, format: 'jwk' }),
    Buffer.from(signature, 'base64url'),
  );

  if (!signatureIsValid) {
    throw new Error('LTI deep linking return signature is invalid.');
  }

  const claims = Lti1p3DeepLinkingReturnJwtClaims.parse(decodeJwtPart(payload, 'payload'));
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);

  if (claims.iss !== input.config.clientId) {
    throw new Error('LTI deep linking return issuer must match the LTI connection client id.');
  }

  if (!audienceContains(claims.aud, input.config.issuer)) {
    throw new Error('LTI deep linking return audience must match the platform issuer.');
  }

  if (claims[ltiDeploymentIdClaim] !== input.config.deploymentId) {
    throw new Error('LTI deep linking return deployment id must match the LTI connection.');
  }

  if (claims.exp <= nowSeconds) {
    throw new Error('LTI deep linking return JWT has expired. Start deep linking again.');
  }

  if (claims[ltiDeepLinkingDataClaim] !== input.expectedData) {
    throw new Error('LTI deep linking return data must match the original deep linking request.');
  }

  return {
    sessionData: decodeLti1p3DeepLinkingSessionData(claims[ltiDeepLinkingDataClaim]),
    contentItems: claims[ltiDeepLinkingContentItemsClaim],
  };
};
