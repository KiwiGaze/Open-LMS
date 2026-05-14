import { createRoute, z } from '@hono/zod-openapi';
import { CourseModuleId } from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const CourseNextPositionScope = z.enum([
  'course_module',
  'course_section',
  'course_unit',
  'gradebook_category',
]);
export type CourseNextPositionScope = z.infer<typeof CourseNextPositionScope>;

export const CourseNextPositionQuery = z
  .object({
    scope: CourseNextPositionScope.openapi({
      description: 'Scope to compute the next position for.',
      example: 'course_module',
    }),
    moduleId: CourseModuleId.optional().openapi({
      description: 'Parent module identifier. Required when scope=course_unit.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
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

export const CourseNextPositionResponse = z
  .object({
    nextPosition: z.number().int().nonnegative().openapi({
      description: 'Next available position (0-based, equal to max(position) + 1, or 0 if empty).',
      example: 5,
    }),
  })
  .strict()
  .openapi('CourseNextPosition');

export const getCourseNextPositionRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/next-position',
  tags: ['Courses'],
  operationId: 'getCourseNextPosition',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: CourseNextPositionQuery,
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Next available position for the requested scope.',
      content: {
        'application/json': {
          schema: CourseNextPositionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
