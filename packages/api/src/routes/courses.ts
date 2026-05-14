import { createRoute, z } from '@hono/zod-openapi';
import {
  CatalogVisibility,
  Course,
  CourseCatalogSettings,
  CourseId,
  TenantId,
} from '@openlms/contracts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseResponse = Course.openapi('Course');

export const TenantPathParams = z.object({
  tenantId: TenantId.openapi({
    param: {
      name: 'tenantId',
      in: 'path',
      description: 'Tenant identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  }),
});

export const listCoursesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses',
  tags: ['Courses'],
  operationId: 'listCourses',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Courses in the tenant.',
      content: {
        'application/json': {
          schema: CourseResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseBody = z
  .object({
    code: z.string().min(1).max(32).openapi({
      description: 'Short, tenant-unique course code.',
      example: 'WRIT-101',
    }),
    title: z.string().min(1).max(160).openapi({
      description: 'Course title.',
      example: 'Evidence-Based Writing',
    }),
    status: z.enum(['draft', 'active', 'archived']).openapi({
      description: 'Lifecycle status for the course.',
      example: 'draft',
    }),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional start date in ISO 8601 format.',
        example: '2026-08-25T00:00:00.000Z',
      }),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional end date in ISO 8601 format.',
        example: '2026-12-15T00:00:00.000Z',
      }),
    catalogCategory: z.string().min(1).max(120).nullable().optional().openapi({
      description: 'Optional catalog category, such as a department or subject family.',
      example: 'Writing',
    }),
    academicTerm: z.string().min(1).max(64).nullable().optional().openapi({
      description: 'Optional academic term label.',
      example: '2026 Fall',
    }),
    isBlueprint: z.boolean().default(false).openapi({
      description: 'Whether this course acts as a blueprint template for copied courses.',
      example: true,
    }),
  })
  .strict();

export const createCourseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses',
  tags: ['Courses'],
  operationId: 'createCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created course.',
      content: {
        'application/json': {
          schema: CourseResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const CourseCatalogSettingsResponse = CourseCatalogSettings.openapi('CourseCatalogSettings');

export const CoursePathParams = TenantPathParams.extend({
  courseId: CourseId.openapi({
    param: {
      name: 'courseId',
      in: 'path',
      description: 'Course identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  }),
});

export const UpdateCourseBody = CreateCourseBody;

export const updateCourseRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}',
  tags: ['Courses'],
  operationId: 'updateCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course.',
      content: {
        'application/json': {
          schema: CourseResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteCourseRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}',
  tags: ['Courses'],
  operationId: 'deleteCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    204: {
      description: 'Course was soft-deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const restoreDeletedCourseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/restore-deleted',
  tags: ['Courses'],
  operationId: 'restoreDeletedCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    200: {
      description: 'Restored course. Restored courses return to draft status.',
      content: {
        'application/json': {
          schema: CourseResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const UpdateCourseCatalogSettingsBody = z
  .object({
    catalogVisibility: CatalogVisibility.openapi({
      description: 'Whether the course is listed in the public catalog.',
      example: 'listed',
    }),
    enrollmentCode: z.string().min(4).max(64).nullable().openapi({
      description: 'Self-enrollment code (null to disable self-enrollment).',
      example: 'JOIN-WRIT-101',
    }),
    catalogCategory: z.string().min(1).max(120).nullable().openapi({
      description: 'Catalog category shown in public listings.',
      example: 'Writing',
    }),
    academicTerm: z.string().min(1).max(64).nullable().openapi({
      description: 'Academic term shown in public listings.',
      example: '2026 Fall',
    }),
    maxEnrollments: z.number().int().positive().nullable().default(null).openapi({
      description: 'Maximum active student enrollments. Null means uncapped.',
      example: 30,
    }),
    waitlistEnabled: z.boolean().default(false).openapi({
      description: 'Whether self-enrollment creates waitlist entries after capacity is full.',
      example: true,
    }),
    enrollmentApprovalRequired: z.boolean().default(false).openapi({
      description: 'Whether self-enrollment creates pending requests for course staff approval.',
      example: true,
    }),
  })
  .strict();

export const updateCourseCatalogSettingsRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/catalog-settings',
  tags: ['Courses'],
  operationId: 'updateCourseCatalogSettings',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseCatalogSettingsBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated catalog settings for the course.',
      content: {
        'application/json': {
          schema: CourseCatalogSettingsResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
