import { createRoute, z } from '@hono/zod-openapi';
import type { MiddlewareHandler } from 'hono';
import {
  AssignmentId,
  Lti1p3AgsResultContainer,
  Lti1p3AgsScore,
  Lti1p3DeepLinkingReturnBody,
  Lti1p3DeepLinkingReturnResult,
  Lti1p3JsonWebKeySet,
  Lti1p3LaunchAuthorizationResponse,
  Lti1p3NamesRolesMembershipContainer,
  Lti1p3NamesRolesRole,
  Lti1p3OidcAuthorizationRequest,
  Lti1p3ServiceAccessToken,
  Lti1p3ServiceTokenRequest,
  UserId,
} from '@openlms/contracts';
import { CourseExternalToolPathParams } from './course-external-tools.ts';
import { CoursePathParams, TenantPathParams } from './courses.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

const lti1p3AgsScoreMediaType = 'application/vnd.ims.lis.v1.score+json';

const normalizeLti1p3AgsScoreContentType: MiddlewareHandler = async (context, next) => {
  const contentType = context.req.header('content-type');

  if (contentType?.toLowerCase().startsWith(lti1p3AgsScoreMediaType)) {
    const headers = new Headers(context.req.raw.headers);
    headers.set('content-type', 'application/json');
    context.req.raw = new Request(context.req.raw, { headers });
  }

  await next();
};

export const Lti1p3JsonWebKeySetResponse = Lti1p3JsonWebKeySet.openapi('Lti1p3JsonWebKeySet');
export const Lti1p3OidcAuthorizationRequestQuery = Lti1p3OidcAuthorizationRequest.openapi(
  'Lti1p3OidcAuthorizationRequest',
);
export const Lti1p3LaunchAuthorizationResponseBody = Lti1p3LaunchAuthorizationResponse.openapi(
  'Lti1p3LaunchAuthorizationResponse',
);
export const Lti1p3DeepLinkingReturnForm = Lti1p3DeepLinkingReturnBody.openapi(
  'Lti1p3DeepLinkingReturnBody',
);
export const Lti1p3DeepLinkingReturnResultBody = Lti1p3DeepLinkingReturnResult.openapi(
  'Lti1p3DeepLinkingReturnResult',
);
export const Lti1p3ServiceTokenForm = Lti1p3ServiceTokenRequest.openapi(
  'Lti1p3ServiceTokenRequest',
);
export const Lti1p3ServiceAccessTokenBody = Lti1p3ServiceAccessToken.openapi(
  'Lti1p3ServiceAccessToken',
);
export const Lti1p3NamesRolesMembershipContainerBody = Lti1p3NamesRolesMembershipContainer.openapi(
  'Lti1p3NamesRolesMembershipContainer',
);
export const Lti1p3AgsScoreBody = Lti1p3AgsScore.openapi('Lti1p3AgsScore');
export const Lti1p3AgsResultContainerBody = Lti1p3AgsResultContainer.openapi(
  'Lti1p3AgsResultContainer',
);
export const Lti1p3NamesRolesQuery = z
  .object({
    role: Lti1p3NamesRolesRole.optional().openapi({
      description: 'Optional LTI role URI used to filter returned memberships.',
      example: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    }),
  })
  .strict();

export const Lti1p3AgsLineItemPathParams = CourseExternalToolPathParams.extend({
  assignmentId: AssignmentId.openapi({
    param: {
      name: 'assignmentId',
      in: 'path',
      description: 'Assignment identifier represented by the AGS line item.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3W',
  }),
});

export const Lti1p3AgsResultsQuery = z
  .object({
    user_id: UserId.optional().openapi({
      description: 'Optional learner id used to filter the returned result container.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3X',
    }),
  })
  .strict();

export const getLti1p3JsonWebKeySetRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/lti-1p3/jwks',
  tags: ['Integrations'],
  operationId: 'getLti1p3JsonWebKeySet',
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Public JSON Web Key Set used by LTI 1.3 tools to verify Open-LMS launches.',
      content: {
        'application/json': {
          schema: Lti1p3JsonWebKeySetResponse,
        },
      },
    },
  },
});

export const authorizeLti1p3OidcLaunchRoute = createRoute({
  method: 'get',
  path: '/api/v1/lti-1p3/authorize',
  tags: ['Integrations'],
  operationId: 'authorizeLti1p3OidcLaunch',
  security: [{ bearerAuth: [] }],
  request: {
    query: Lti1p3OidcAuthorizationRequestQuery,
  },
  responses: {
    200: {
      description: 'Signed LTI 1.3 form-post launch response for a validated OIDC launch request.',
      content: {
        'application/json': {
          schema: Lti1p3LaunchAuthorizationResponseBody,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const processLti1p3DeepLinkingReturnRoute = createRoute({
  method: 'post',
  path: '/api/v1/lti-1p3/deep-linking/return',
  tags: ['Integrations'],
  operationId: 'processLti1p3DeepLinkingReturn',
  request: {
    body: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: Lti1p3DeepLinkingReturnForm,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'LTI 1.3 deep linking content items processed.',
      content: {
        'application/json': {
          schema: Lti1p3DeepLinkingReturnResultBody,
        },
      },
    },
    400: badRequestResponse,
    403: forbiddenResponse,
  },
});

export const createLti1p3ServiceAccessTokenRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/lti-1p3/token',
  tags: ['Integrations'],
  operationId: 'createLti1p3ServiceAccessToken',
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: Lti1p3ServiceTokenForm,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OAuth 2 client credentials access token for LTI Advantage services.',
      content: {
        'application/json': {
          schema: Lti1p3ServiceAccessTokenBody,
        },
      },
    },
    400: badRequestResponse,
  },
});

export const getLti1p3NamesRolesMembershipsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/lti-1p3/namesroles',
  tags: ['Integrations'],
  operationId: 'getLti1p3NamesRolesMemberships',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
    query: Lti1p3NamesRolesQuery,
  },
  responses: {
    200: {
      description: 'LTI Names and Role Provisioning Services context membership container.',
      content: {
        'application/vnd.ims.lti-nrps.v2.membershipcontainer+json': {
          schema: Lti1p3NamesRolesMembershipContainerBody,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const publishLti1p3AgsScoreRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/external-tools/{toolId}/lti-ags/lineitem/scores',
  tags: ['Integrations'],
  operationId: 'publishLti1p3AgsScore',
  middleware: normalizeLti1p3AgsScoreContentType,
  security: [{ bearerAuth: [] }],
  request: {
    params: Lti1p3AgsLineItemPathParams,
    body: {
      required: true,
      content: {
        'application/vnd.ims.lis.v1.score+json': {
          schema: Lti1p3AgsScoreBody,
        },
        'application/json': {
          schema: Lti1p3AgsScoreBody,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'LTI AGS score accepted for the line item.',
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listLti1p3AgsResultsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/external-tools/{toolId}/lti-ags/lineitem/results',
  tags: ['Integrations'],
  operationId: 'listLti1p3AgsResults',
  security: [{ bearerAuth: [] }],
  request: {
    params: Lti1p3AgsLineItemPathParams,
    query: Lti1p3AgsResultsQuery,
  },
  responses: {
    200: {
      description: 'LTI AGS result container for the line item.',
      content: {
        'application/vnd.ims.lis.v2.resultcontainer+json': {
          schema: Lti1p3AgsResultContainerBody,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
