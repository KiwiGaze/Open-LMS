import { createRoute } from '@hono/zod-openapi';
import { CourseFavorite } from '@openlms/contracts';
import { CoursePathParams, TenantPathParams } from './courses.ts';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from './responses.ts';

export const CourseFavoriteResponse = CourseFavorite.openapi('CourseFavorite');

export const listCourseFavoritesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/favorites',
  tags: ['Course Favorites'],
  operationId: 'listCourseFavorites',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Favorite courses for the authenticated user in this tenant.',
      content: {
        'application/json': {
          schema: CourseFavoriteResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const favoriteCourseRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/favorite',
  tags: ['Course Favorites'],
  operationId: 'favoriteCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    200: {
      description:
        'Course favorited. Idempotent — returns the existing favorite record when called twice.',
      content: {
        'application/json': {
          schema: CourseFavoriteResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const unfavoriteCourseRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/favorite',
  tags: ['Course Favorites'],
  operationId: 'unfavoriteCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
  },
  responses: {
    204: {
      description: 'Course removed from favorites. Idempotent.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
