import { createRoute, z } from '@hono/zod-openapi';
import {
  Assignment,
  AssignmentAiSettings,
  AssignmentEffectiveSchedule,
  AssignmentId,
  AssignmentStatus,
  CourseId,
  CourseGroupSetId,
  CourseModuleId,
  CourseUnitId,
  RubricId,
  TenantId,
} from '@openlms/contracts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const AssignmentResponse = Assignment.openapi('Assignment');

export const CourseAssignmentPathParams = z.object({
  tenantId: TenantId.openapi({
    param: {
      name: 'tenantId',
      in: 'path',
      description: 'Tenant identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  }),
  courseId: CourseId.openapi({
    param: {
      name: 'courseId',
      in: 'path',
      description: 'Course identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  }),
});

export const AssignmentsQuery = z.object({
  moduleId: CourseModuleId.optional().openapi({
    description: 'Optional module filter for module-placed assignments.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE31',
  }),
  unitId: CourseUnitId.optional().openapi({
    description: 'Optional unit filter for unit-placed assignments.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE32',
  }),
});

export const listAssignmentsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments',
  tags: ['Assignments'],
  operationId: 'listAssignments',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: AssignmentsQuery,
  },
  responses: {
    200: {
      description: 'Assignments visible to the authenticated user for the course.',
      content: {
        'application/json': {
          schema: AssignmentResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateAssignmentBody = z
  .object({
    moduleId: CourseModuleId.nullable().openapi({
      description: 'Optional parent module identifier.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
    unitId: CourseUnitId.nullable().openapi({
      description: 'Optional parent unit identifier; requires moduleId when set.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE32',
    }),
    position: z.number().int().nonnegative().nullable().openapi({
      description: 'Sort position within the parent module or unit.',
      example: 0,
    }),
    title: z.string().min(1).max(180).openapi({
      description: 'Assignment title.',
      example: 'Essay 1: Defending a thesis',
    }),
    instructions: z.string().min(1).openapi({
      description: 'Instructions presented to learners.',
      example: 'Argue your interpretation of the text using cited evidence.',
    }),
    status: AssignmentStatus.openapi({
      description: 'Lifecycle status for the assignment.',
      example: 'draft',
    }),
    dueAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional due date in ISO 8601 format.',
        example: '2026-09-15T17:00:00.000Z',
      }),
    allowResubmission: z.boolean().openapi({
      description: 'Whether learners can resubmit after submission.',
      example: true,
    }),
    activeRubricId: RubricId.nullable().openapi({
      description: 'Optional rubric used to grade this assignment.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3C',
    }),
    aiSettings: AssignmentAiSettings.openapi({
      description: 'AI feature toggles for this assignment.',
    }),
    extraCredit: z.boolean().optional().openapi({
      description:
        'When true, this assignment is treated as extra credit: points contribute to earned score but not to the maximum points possible.',
      example: false,
    }),
    anonymousGradingEnabled: z.boolean().optional().openapi({
      description:
        'When true, instructor-facing submission views conceal student identity until feedback is published.',
      example: false,
    }),
    groupSubmissionEnabled: z.boolean().optional().openapi({
      description:
        'When true, learners submit once for their active group in the configured group set.',
      example: false,
    }),
    groupSetId: CourseGroupSetId.nullable().optional().openapi({
      description: 'Group set used to resolve the learner group for group submissions.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE55',
    }),
    allowedFileExtensions: z
      .array(z.string().min(1).max(32).regex(/^[a-z0-9][a-z0-9_-]*$/))
      .optional()
      .openapi({
        description:
          'Allowed lowercase file extensions for submission attachments, without leading dots. Empty allows any extension.',
        example: ['pdf', 'docx'],
      }),
    maxFileSizeBytes: z.number().int().positive().nullable().optional().openapi({
      description: 'Maximum allowed submission attachment size in bytes. Null disables the limit.',
      example: 2000000,
    }),
  })
  .strict()
  .superRefine((assignment, context) => {
    if (assignment.unitId !== null && assignment.moduleId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit assignments must include their parent module.',
        path: ['moduleId'],
      });
    }
    if (assignment.groupSubmissionEnabled === true && !assignment.groupSetId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Group assignments must include a group set.',
        path: ['groupSetId'],
      });
    }
    if (assignment.groupSubmissionEnabled !== true && assignment.groupSetId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Individual assignments cannot include a group set.',
        path: ['groupSetId'],
      });
    }
  });

export const createAssignmentRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments',
  tags: ['Assignments'],
  operationId: 'createAssignment',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateAssignmentBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created assignment.',
      content: {
        'application/json': {
          schema: AssignmentResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const AssignmentPathParams = CourseAssignmentPathParams.extend({
  assignmentId: AssignmentId.openapi({
    param: {
      name: 'assignmentId',
      in: 'path',
      description: 'Assignment identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3D',
  }),
});

export const UpdateAssignmentBody = CreateAssignmentBody;

export const updateAssignmentRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}',
  tags: ['Assignments'],
  operationId: 'updateAssignment',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateAssignmentBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated assignment.',
      content: {
        'application/json': {
          schema: AssignmentResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteAssignmentRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}',
  tags: ['Assignments'],
  operationId: 'deleteAssignment',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentPathParams,
  },
  responses: {
    204: {
      description: 'Assignment deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const AssignmentEffectiveScheduleResponse = AssignmentEffectiveSchedule.openapi(
  'AssignmentEffectiveSchedule',
);

export const getAssignmentEffectiveScheduleRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/effective-schedule',
  tags: ['Assignments'],
  operationId: 'getAssignmentEffectiveSchedule',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentPathParams,
  },
  responses: {
    200: {
      description:
        'Effective schedule (opens, due, closes) for the authenticated learner after applying any overrides targeting them by user or group membership.',
      content: {
        'application/json': {
          schema: AssignmentEffectiveScheduleResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
