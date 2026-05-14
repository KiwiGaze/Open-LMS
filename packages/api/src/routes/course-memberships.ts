import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseMembership,
  CourseMembershipId,
  CourseMembershipStatus,
  CourseRole,
  RosterImportSummary,
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

export const CourseMembershipResponse = CourseMembership.openapi('CourseMembership');
export const CreateCourseMembershipBody = z
  .object({
    userId: UserId.openapi({
      description: 'User identifier to enroll in the course.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE85',
    }),
    role: CourseRole.openapi({
      description: 'Course role to assign to the user.',
      example: 'student',
    }),
    status: CourseMembershipStatus.optional().default('active').openapi({
      description: 'Initial lifecycle status for the course membership.',
      example: 'active',
    }),
  })
  .strict();

export const BulkEnrollItem = z
  .object({
    userId: UserId,
    role: CourseRole,
    status: CourseMembershipStatus.optional().default('active'),
  })
  .strict();

export const BulkEnrollBody = z
  .object({
    items: z.array(BulkEnrollItem).min(1).max(500),
  })
  .strict();

export const BulkEnrollResult = z
  .object({
    userId: UserId,
    status: z.enum(['enrolled', 'failed']),
    membership: CourseMembership.nullable(),
    error: z.string().nullable(),
  })
  .strict()
  .openapi('BulkEnrollResult');

export const BulkEnrollResponse = z
  .object({
    results: z.array(BulkEnrollResult),
    enrolledCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
  })
  .strict()
  .openapi('BulkEnrollResponse');

export const ListCourseMembershipsQuery = z.object({
  role: CourseRole.optional().openapi({
    description: 'Restrict results to memberships with this course role.',
    example: 'student',
  }),
  status: CourseMembershipStatus.optional().openapi({
    description: 'Restrict results to memberships with this lifecycle status.',
    example: 'active',
  }),
});

export const listCourseMembershipsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships',
  tags: ['Course Memberships'],
  operationId: 'listCourseMemberships',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: ListCourseMembershipsQuery,
  },
  responses: {
    200: {
      description: 'Course memberships visible to course staff. Filterable by role.',
      content: {
        'application/json': {
          schema: CourseMembershipResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createCourseMembershipRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships',
  tags: ['Course Memberships'],
  operationId: 'createCourseMembership',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseMembershipBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course membership.',
      content: {
        'application/json': {
          schema: CourseMembershipResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const CourseMembershipPathParams = CourseAssignmentPathParams.extend({
  courseMembershipId: CourseMembershipId.openapi({
    param: {
      name: 'courseMembershipId',
      in: 'path',
      description: 'Course membership identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3F',
  }),
});

export const UpdateCourseMembershipBody = z
  .object({
    role: CourseRole.optional().openapi({
      description: 'Updated course role for the user.',
      example: 'teaching_assistant',
    }),
    status: CourseMembershipStatus.optional().openapi({
      description: 'Updated lifecycle status for add, drop, withdraw, invitation, or waitlist flows.',
      example: 'withdrawn',
    }),
  })
  .strict()
  .refine((input) => input.role !== undefined || input.status !== undefined, {
    message: 'Provide role or status to update the membership.',
  });

export const updateCourseMembershipRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/{courseMembershipId}',
  tags: ['Course Memberships'],
  operationId: 'updateCourseMembership',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseMembershipPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseMembershipBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course membership.',
      content: {
        'application/json': {
          schema: CourseMembershipResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteCourseMembershipRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/{courseMembershipId}',
  tags: ['Course Memberships'],
  operationId: 'deleteCourseMembership',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseMembershipPathParams,
  },
  responses: {
    204: {
      description: 'Course membership removed.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const SelfEnrollInCourseBody = z
  .object({
    enrollmentCode: z.string().min(1).max(64).openapi({
      description: 'Enrollment code shared by the instructor.',
      example: 'JOIN-WRIT-101',
    }),
  })
  .strict();

export const selfEnrollInCourseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/self-enroll',
  tags: ['Course Memberships'],
  operationId: 'selfEnrollInCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SelfEnrollInCourseBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Course membership for the authenticated student.',
      content: {
        'application/json': {
          schema: CourseMembershipResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const bulkEnrollInCourseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/bulk',
  tags: ['Course Memberships'],
  operationId: 'bulkEnrollInCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: BulkEnrollBody } },
    },
  },
  responses: {
    200: {
      description: 'Per-item outcome of the bulk enrollment. Failures are surfaced per item.',
      content: { 'application/json': { schema: BulkEnrollResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const importCourseRosterCsvRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/import-csv',
  tags: ['Course Memberships'],
  operationId: 'importCourseRosterCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'text/csv': {
          schema: z.string().min(1),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Per-row outcome of the roster CSV import.',
      content: {
        'application/json': {
          schema: RosterImportSummary.openapi('RosterImportSummary'),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const exportCourseRosterCsvRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/export.csv',
  tags: ['Course Memberships'],
  operationId: 'exportCourseRosterCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course roster CSV.',
      content: {
        'text/csv': {
          schema: z.string(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const BulkDeleteMembershipsBody = z
  .object({
    courseMembershipIds: z.array(CourseMembershipId).min(1).max(500),
  })
  .strict();

export const BulkDeleteMembershipsResult = z
  .object({
    courseMembershipId: CourseMembershipId,
    status: z.enum(['deleted', 'failed']),
    error: z.string().nullable(),
  })
  .strict()
  .openapi('BulkDeleteMembershipsResult');

export const BulkDeleteMembershipsResponse = z
  .object({
    results: z.array(BulkDeleteMembershipsResult),
    deletedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
  })
  .strict()
  .openapi('BulkDeleteMembershipsResponse');

export const bulkDeleteCourseMembershipsRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/memberships/bulk-delete',
  tags: ['Course Memberships'],
  operationId: 'bulkDeleteCourseMemberships',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: BulkDeleteMembershipsBody } },
    },
  },
  responses: {
    200: {
      description: 'Per-item outcome of the bulk membership delete.',
      content: { 'application/json': { schema: BulkDeleteMembershipsResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
