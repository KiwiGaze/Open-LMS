import { createRoute, z } from '@hono/zod-openapi';
import {
  AssignmentOverride,
  AssignmentOverrideId,
  AssignmentOverrideStatus,
  AssignmentOverrideTargetType,
} from '@openlms/contracts';
import { AssignmentRubricPathParams } from './assignment-rubrics.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const AssignmentOverrideResponse = AssignmentOverride.openapi('AssignmentOverride');

export const listAssignmentOverridesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides',
  tags: ['Assignments'],
  operationId: 'listAssignmentOverrides',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentRubricPathParams,
  },
  responses: {
    200: {
      description: 'Assignment availability overrides visible to course staff.',
      content: {
        'application/json': {
          schema: AssignmentOverrideResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateAssignmentOverrideBody = z
  .object({
    targetType: AssignmentOverrideTargetType.openapi({
      description: 'Whether this override targets an individual user, group, or section.',
      example: 'user',
    }),
    targetId: z.string().min(1).openapi({
      description: 'Identifier of the target (user id, group id, or section id).',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3F',
    }),
    opensAt: z.string().datetime().nullable().openapi({
      description: 'When the override window opens (or null).',
    }),
    dueAt: z.string().datetime().nullable().openapi({
      description: 'When the override is due (or null).',
    }),
    closesAt: z.string().datetime().nullable().openapi({
      description: 'When the override window closes (or null).',
    }),
    status: AssignmentOverrideStatus.openapi({
      description: 'Lifecycle status for this override.',
      example: 'active',
    }),
  })
  .strict();

export const createAssignmentOverrideRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides',
  tags: ['Assignments'],
  operationId: 'createAssignmentOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentRubricPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateAssignmentOverrideBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created assignment override.',
      content: {
        'application/json': {
          schema: AssignmentOverrideResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const AssignmentOverridePathParams = AssignmentRubricPathParams.extend({
  overrideId: AssignmentOverrideId.openapi({
    param: {
      name: 'overrideId',
      in: 'path',
      description: 'Assignment override identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3E',
  }),
});

export const UpdateAssignmentOverrideBody = z
  .object({
    opensAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: 'When the override window opens (or null).' }),
    dueAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: 'When the override is due (or null).' }),
    closesAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ description: 'When the override window closes (or null).' }),
    status: AssignmentOverrideStatus.openapi({
      description: 'Lifecycle status for this override.',
      example: 'active',
    }),
  })
  .strict();

export const deleteAssignmentOverrideRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides/{overrideId}',
  tags: ['Assignments'],
  operationId: 'deleteAssignmentOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentOverridePathParams,
  },
  responses: {
    204: {
      description: 'Assignment override deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const updateAssignmentOverrideRoute = createRoute({
  method: 'patch',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/overrides/{overrideId}',
  tags: ['Assignments'],
  operationId: 'updateAssignmentOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentOverridePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateAssignmentOverrideBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated assignment override.',
      content: {
        'application/json': {
          schema: AssignmentOverrideResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
