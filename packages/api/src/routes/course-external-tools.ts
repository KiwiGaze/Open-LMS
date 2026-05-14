import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseExternalTool,
  CourseExternalToolId,
  CourseExternalToolPlacement,
  CourseExternalToolStatus,
  IntegrationConnectionId,
  Lti1p3LaunchAuthorizationRequest,
  Lti1p3LaunchAuthorizationResponse,
  Lti1p3OidcLoginInitiation,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseExternalToolResponse = CourseExternalTool.openapi('CourseExternalTool');
export const Lti1p3OidcLoginInitiationResponse = Lti1p3OidcLoginInitiation.openapi(
  'Lti1p3OidcLoginInitiation',
);
export const Lti1p3LaunchAuthorizationRequestBody = Lti1p3LaunchAuthorizationRequest.openapi(
  'Lti1p3LaunchAuthorizationRequest',
);
export const Lti1p3LaunchAuthorizationResponseBody = Lti1p3LaunchAuthorizationResponse.openapi(
  'Lti1p3LaunchAuthorizationResponse',
);

export const listCourseExternalToolsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools',
  tags: ['Integrations'],
  operationId: 'listCourseExternalTools',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course external tool placements visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseExternalToolResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseExternalToolBody = z
  .object({
    integrationConnectionId: IntegrationConnectionId.openapi({
      description: 'Integration connection this tool launches through.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8G',
    }),
    name: z.string().min(1).max(180).openapi({
      description: 'External tool display name. Unique per course.',
      example: 'Mathway',
    }),
    description: z.string().min(1).max(500).nullable().openapi({
      description: 'Optional course-facing description.',
      example: 'Step-by-step math problem solver.',
    }),
    launchUrl: z
      .string()
      .regex(/^https:\/\//, {
        message: 'Course external tool launch URL must use HTTPS.',
      })
      .url()
      .max(2048)
      .openapi({
        description: 'HTTPS launch URL for the external tool.',
        example: 'https://launch.example.test/mathway',
      }),
    placement: CourseExternalToolPlacement.openapi({
      description: 'Where the tool appears in the course UI.',
      example: 'course_navigation',
    }),
    status: CourseExternalToolStatus.openapi({
      description: 'Lifecycle status for the external tool placement.',
      example: 'active',
    }),
  })
  .strict();

export const createCourseExternalToolRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools',
  tags: ['Integrations'],
  operationId: 'createCourseExternalTool',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseExternalToolBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course external tool.',
      content: {
        'application/json': {
          schema: CourseExternalToolResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const CourseExternalToolPathParams = CourseAssignmentPathParams.extend({
  toolId: CourseExternalToolId.openapi({
    param: {
      name: 'toolId',
      in: 'path',
      description: 'Course external tool identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE94',
  }),
});

export const UpdateCourseExternalToolBody = CreateCourseExternalToolBody;

export const updateCourseExternalToolRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}',
  tags: ['Integrations'],
  operationId: 'updateCourseExternalTool',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseExternalToolPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseExternalToolBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course external tool.',
      content: {
        'application/json': {
          schema: CourseExternalToolResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteCourseExternalToolRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}',
  tags: ['Integrations'],
  operationId: 'deleteCourseExternalTool',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseExternalToolPathParams,
  },
  responses: {
    204: {
      description: 'Course external tool deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const launchCourseExternalToolLti1p3Route = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch',
  tags: ['Integrations'],
  operationId: 'launchCourseExternalToolLti1p3',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseExternalToolPathParams,
  },
  responses: {
    200: {
      description: 'OIDC login initiation URL for launching an active LTI 1.3 external tool.',
      content: {
        'application/json': {
          schema: Lti1p3OidcLoginInitiationResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const launchCourseExternalToolLti1p3DeepLinkingRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/deep-linking/launch',
  tags: ['Integrations'],
  operationId: 'launchCourseExternalToolLti1p3DeepLinking',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseExternalToolPathParams,
  },
  responses: {
    200: {
      description: 'OIDC login initiation URL for selecting LTI 1.3 deep-linking content.',
      content: {
        'application/json': {
          schema: Lti1p3OidcLoginInitiationResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createCourseExternalToolLti1p3LaunchAuthorizationResponseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/external-tools/{toolId}/lti-1p3/launch-response',
  tags: ['Integrations'],
  operationId: 'createCourseExternalToolLti1p3LaunchAuthorizationResponse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseExternalToolPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: Lti1p3LaunchAuthorizationRequestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Signed LTI 1.3 form-post launch response for an active external tool.',
      content: {
        'application/json': {
          schema: Lti1p3LaunchAuthorizationResponseBody,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
