import {
  CourseExternalToolId,
  CourseId,
  Lti1p3DeepLinkingSessionId,
  type Lti1p3LaunchType as Lti1p3LaunchTypeContract,
  Lti1p3OidcAuthorizationRequest,
  type Lti1p3OidcAuthorizationRequest as Lti1p3OidcAuthorizationRequestContract,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { z } from 'zod';

const Lti1p3BaseLaunchMessageHint = z.object({
  tenantId: TenantId,
  courseId: CourseId,
  toolId: CourseExternalToolId,
  actorUserId: UserId,
});

export const Lti1p3LaunchMessageHint = z.discriminatedUnion('launchType', [
  Lti1p3BaseLaunchMessageHint.extend({
    launchType: z.literal('resource_link'),
  }).strict(),
  Lti1p3BaseLaunchMessageHint.extend({
    launchType: z.literal('deep_linking'),
    deepLinkingSessionId: Lti1p3DeepLinkingSessionId,
  }).strict(),
]);
export type Lti1p3LaunchMessageHint = z.infer<typeof Lti1p3LaunchMessageHint>;

export type ResolvedLti1p3OidcAuthorizationRequest = {
  actorUserId: string;
  tenantId: string;
  courseId: string;
  toolId: string;
  launchType: Lti1p3LaunchTypeContract;
  deepLinkingSessionId?: string;
  clientId: string;
  launchRequest: {
    redirectUri: string;
    nonce: string;
    state: string;
  };
};

export const encodeLti1p3LaunchMessageHint = (value: Lti1p3LaunchMessageHint): string =>
  Buffer.from(JSON.stringify(Lti1p3LaunchMessageHint.parse(value)), 'utf8').toString('base64url');

export const decodeLti1p3LaunchMessageHint = (value: string): Lti1p3LaunchMessageHint => {
  try {
    return Lti1p3LaunchMessageHint.parse(
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('LTI launch message hint is malformed. Start the launch again.');
    }

    throw error;
  }
};

export const resolveLti1p3OidcAuthorizationRequest = (
  input: Lti1p3OidcAuthorizationRequestContract,
): ResolvedLti1p3OidcAuthorizationRequest => {
  const request = Lti1p3OidcAuthorizationRequest.parse(input);
  const messageHint = decodeLti1p3LaunchMessageHint(request.lti_message_hint);

  if (request.login_hint !== messageHint.actorUserId) {
    throw new Error('LTI OIDC login_hint must match the launch message hint actor.');
  }

  return {
    actorUserId: messageHint.actorUserId,
    tenantId: messageHint.tenantId,
    courseId: messageHint.courseId,
    toolId: messageHint.toolId,
    launchType: messageHint.launchType,
    ...(messageHint.launchType === 'deep_linking'
      ? { deepLinkingSessionId: messageHint.deepLinkingSessionId }
      : {}),
    clientId: request.client_id,
    launchRequest: {
      redirectUri: request.redirect_uri,
      nonce: request.nonce,
      state: request.state,
    },
  };
};
