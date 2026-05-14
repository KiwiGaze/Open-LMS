import {
  Lti1p3JsonWebKeySet,
  type Lti1p3JsonWebKeySet as Lti1p3JsonWebKeySetContract,
  type Lti1p3PlatformKey,
} from '@openlms/contracts';

export const buildLti1p3JsonWebKeySet = (keys: Lti1p3PlatformKey[]): Lti1p3JsonWebKeySetContract =>
  Lti1p3JsonWebKeySet.parse({
    keys: keys.map((key) => key.publicJwk),
  });
