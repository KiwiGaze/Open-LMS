import { createRoute } from '@hono/zod-openapi';
import { AssignmentId, Rubric } from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from './responses.ts';

export const AssignmentRubricResponse = Rubric.openapi('Rubric');

export const AssignmentRubricPathParams = CourseAssignmentPathParams.extend({
  assignmentId: AssignmentId.openapi({
    param: {
      name: 'assignmentId',
      in: 'path',
      description: 'Assignment identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE36',
  }),
});

export const getAssignmentRubricRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/rubric',
  tags: ['Assignments'],
  operationId: 'getAssignmentRubric',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentRubricPathParams,
  },
  responses: {
    200: {
      description: 'Active rubric attached to an assignment visible to the authenticated user.',
      content: {
        'application/json': {
          schema: AssignmentRubricResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
