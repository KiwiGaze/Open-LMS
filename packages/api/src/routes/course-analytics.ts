import { createRoute } from '@hono/zod-openapi';
import { CourseAnalyticsSummary } from '@openlms/contracts';
import { CoursePathParams } from './courses.ts';
import { forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const CourseAnalyticsSummaryResponse =
  CourseAnalyticsSummary.openapi('CourseAnalyticsSummary');

export const getCourseAnalyticsSummaryRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/analytics/summary',
  tags: ['Courses'],
  operationId: 'getCourseAnalyticsSummary',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    200: {
      description: 'Aggregate counts for instructor dashboards.',
      content: {
        'application/json': {
          schema: CourseAnalyticsSummaryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
