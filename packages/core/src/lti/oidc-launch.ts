import {
  type CourseExternalTool,
  CourseId,
  type IntegrationConnection,
  Lti1p3ConnectionConfig,
  Lti1p3DeepLinkingSessionId,
  type Lti1p3LaunchType,
  Lti1p3OidcLoginInitiation,
  type Lti1p3OidcLoginInitiation as Lti1p3OidcLoginInitiationContract,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { assertValidLti1p3LaunchContext } from './launch-context.ts';
import { encodeLti1p3LaunchMessageHint } from './oidc-authorization.ts';

export type CreateLti1p3OidcLoginInitiationInput = {
  actorUserId: string;
  tenantId: string;
  courseId: string;
  tool: CourseExternalTool;
  connection: IntegrationConnection;
  launchType?: Lti1p3LaunchType;
  deepLinkingSessionId?: string;
};

export const createLti1p3OidcLoginInitiation = (
  input: CreateLti1p3OidcLoginInitiationInput,
): Lti1p3OidcLoginInitiationContract => {
  assertValidLti1p3LaunchContext(input);

  const config = Lti1p3ConnectionConfig.parse(input.connection.config);
  const launchType = input.launchType ?? 'resource_link';

  if (launchType === 'deep_linking' && input.deepLinkingSessionId === undefined) {
    throw new Error('LTI deep linking launch requires a deep linking session id.');
  }

  const messageHint =
    launchType === 'deep_linking'
      ? {
          tenantId: TenantId.parse(input.tenantId),
          courseId: CourseId.parse(input.courseId),
          toolId: input.tool.id,
          actorUserId: UserId.parse(input.actorUserId),
          launchType,
          deepLinkingSessionId: Lti1p3DeepLinkingSessionId.parse(input.deepLinkingSessionId),
        }
      : {
          tenantId: TenantId.parse(input.tenantId),
          courseId: CourseId.parse(input.courseId),
          toolId: input.tool.id,
          actorUserId: UserId.parse(input.actorUserId),
          launchType,
        };

  const url = new URL(config.oidcLoginUrl);
  url.searchParams.set('iss', config.issuer);
  url.searchParams.set('login_hint', input.actorUserId);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('lti_deployment_id', config.deploymentId);
  url.searchParams.set('target_link_uri', input.tool.launchUrl);
  url.searchParams.set('lti_message_hint', encodeLti1p3LaunchMessageHint(messageHint));

  return Lti1p3OidcLoginInitiation.parse({
    method: 'redirect',
    url: url.toString(),
  });
};
