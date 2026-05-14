import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseGroup,
  CourseGroupId,
  CourseGroupMember,
  CourseGroupMemberRole,
  CourseGroupSet,
  CourseGroupSetId,
  CourseGroupSetStatus,
  CourseGroupStatus,
  UserId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseGroupSetResponse = CourseGroupSet.openapi('CourseGroupSet');
export const CourseGroupResponse = CourseGroup.openapi('CourseGroup');
export const CourseGroupMemberResponse = CourseGroupMember.openapi('CourseGroupMember');

export const CourseGroupPathParams = CourseAssignmentPathParams.extend({
  groupId: CourseGroupId.openapi({
    param: {
      name: 'groupId',
      in: 'path',
      description: 'Course group identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE56',
  }),
});

export const listCourseGroupSetsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets',
  tags: ['Groups'],
  operationId: 'listCourseGroupSets',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course group sets visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseGroupSetResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseGroupSetBody = z
  .object({
    name: z.string().min(1).max(120).openapi({
      description: 'Group set name displayed to learners.',
      example: 'Project teams',
    }),
    selfSignupEnabled: z.boolean().openapi({
      description: 'Whether learners can sign themselves up for groups in this set.',
      example: false,
    }),
    status: CourseGroupSetStatus.openapi({
      description: 'Lifecycle status for the group set.',
      example: 'active',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the course group catalog.',
      example: 0,
    }),
  })
  .strict();

export const createCourseGroupSetRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/group-sets',
  tags: ['Groups'],
  operationId: 'createCourseGroupSet',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseGroupSetBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course group set.',
      content: {
        'application/json': {
          schema: CourseGroupSetResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCourseGroupsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/groups',
  tags: ['Groups'],
  operationId: 'listCourseGroups',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course groups visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseGroupResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseGroupBody = z
  .object({
    groupSetId: CourseGroupSetId.openapi({
      description: 'Parent group set identifier.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE55',
    }),
    name: z.string().min(1).max(120).openapi({
      description: 'Group name displayed to learners.',
      example: 'Team Alpha',
    }),
    description: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional group description.',
      example: 'Project team for week 1.',
    }),
    status: CourseGroupStatus.openapi({
      description: 'Lifecycle status for the group.',
      example: 'active',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the parent group set.',
      example: 0,
    }),
  })
  .strict();

export const createCourseGroupRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/groups',
  tags: ['Groups'],
  operationId: 'createCourseGroup',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseGroupBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course group.',
      content: {
        'application/json': {
          schema: CourseGroupResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCourseGroupMembersRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members',
  tags: ['Groups'],
  operationId: 'listCourseGroupMembers',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGroupPathParams,
  },
  responses: {
    200: {
      description: 'Course group members visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseGroupMemberResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const CreateCourseGroupMemberBody = z
  .object({
    userId: UserId.openapi({
      description: 'Identifier of the user to add to the group.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8M',
    }),
    role: CourseGroupMemberRole.openapi({
      description: 'Role of the member in the group.',
      example: 'member',
    }),
  })
  .strict();

export const createCourseGroupMemberRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/members',
  tags: ['Groups'],
  operationId: 'createCourseGroupMember',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGroupPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseGroupMemberBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course group member.',
      content: {
        'application/json': {
          schema: CourseGroupMemberResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const leaveCourseGroupRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/membership',
  tags: ['Groups'],
  operationId: 'leaveCourseGroup',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGroupPathParams,
  },
  responses: {
    204: {
      description: 'Authenticated learner left the group. Idempotent.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const joinCourseGroupRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/groups/{groupId}/join',
  tags: ['Groups'],
  operationId: 'joinCourseGroup',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGroupPathParams,
  },
  responses: {
    201: {
      description:
        'Authenticated learner joined the group. Requires the parent group set to have self-signup enabled.',
      content: {
        'application/json': {
          schema: CourseGroupMemberResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});
