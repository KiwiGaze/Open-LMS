import { createRoute, z } from '@hono/zod-openapi';
import { CourseBackup } from '@openlms/contracts';
import { CoursePathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const RestoreCourseBackupBody = z
  .object({
    backup: CourseBackup,
  })
  .strict();

export const RestoreCourseBackupResponse = z
  .object({
    learningObjectivesRestored: z.number().int().nonnegative().openapi({
      description: 'Number of learning objectives restored into the target course.',
      example: 5,
    }),
    modulesRestored: z.number().int().nonnegative().openapi({
      description: 'Number of modules restored into the target course.',
      example: 4,
    }),
    unitsRestored: z.number().int().nonnegative().openapi({
      description: 'Number of course units restored into the target course.',
      example: 8,
    }),
    pagesRestored: z.number().int().nonnegative().openapi({
      description: 'Number of course pages restored into the target course.',
      example: 3,
    }),
    resourcesRestored: z.number().int().nonnegative().openapi({
      description: 'Number of course resources restored into the target course.',
      example: 12,
    }),
  })
  .strict()
  .openapi('RestoreCourseBackupResult');

export const restoreCourseBackupRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/restore',
  tags: ['Courses'],
  operationId: 'restoreCourseBackup',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RestoreCourseBackupBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Backup restored successfully.',
      content: {
        'application/json': {
          schema: RestoreCourseBackupResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
