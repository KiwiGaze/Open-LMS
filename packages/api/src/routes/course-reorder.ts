import { createRoute, z } from '@hono/zod-openapi';
import { CourseModuleId } from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

const ReorderScopeKind = z.enum([
  'course_module',
  'course_section',
  'course_unit',
  'gradebook_category',
]);

export const ReorderCourseContentBody = z
  .object({
    scope: ReorderScopeKind.openapi({
      description: 'Scope of ordered content being reordered.',
      example: 'course_module',
    }),
    moduleId: CourseModuleId.optional().openapi({
      description: 'Parent module identifier. Required when scope=course_unit.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
    orderedIds: z
      .array(z.string().min(1).max(64))
      .min(1)
      .max(500)
      .openapi({
        description: 'New ordering. Each item is assigned position = array index.',
        example: ['01J9QW7B6N5W2YH3D3A1V0KE31', '01J9QW7B6N5W2YH3D3A1V0KE32'],
      }),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.scope === 'course_unit' && !value.moduleId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'moduleId is required when scope=course_unit.',
        path: ['moduleId'],
      });
    }
    if (value.scope !== 'course_unit' && value.moduleId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'moduleId is only valid when scope=course_unit.',
        path: ['moduleId'],
      });
    }
  });

export const ReorderCourseContentResponse = z
  .object({
    reordered: z.number().int().nonnegative().openapi({
      description: 'Number of items whose positions were updated.',
      example: 4,
    }),
  })
  .strict()
  .openapi('ReorderCourseContent');

export const reorderCourseContentRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/reorder',
  tags: ['Courses'],
  operationId: 'reorderCourseContent',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: ReorderCourseContentBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Course content reorder applied.',
      content: {
        'application/json': {
          schema: ReorderCourseContentResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
