import { createRoute } from '@hono/zod-openapi';
import { CourseBackup } from '@openlms/contracts';
import { CoursePathParams } from './courses.ts';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from './responses.ts';

export const CourseBackupResponse = CourseBackup.openapi('CourseBackup');

export const exportCourseBackupRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/backup',
  tags: ['Courses'],
  operationId: 'exportCourseBackup',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    200: {
      description: 'JSON snapshot of course content for backup or migration.',
      content: {
        'application/json': {
          schema: CourseBackupResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
