import { createRoute, z } from '@hono/zod-openapi';
import { CourseId, CourseResourceId, CourseResourceViewEvent, TenantId } from '@openlms/contracts';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from './responses.ts';

export const CourseResourceViewEventResponse =
  CourseResourceViewEvent.openapi('CourseResourceViewEvent');

export const ResourceViewPathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
  courseId: CourseId.openapi({
    param: { name: 'courseId', in: 'path', description: 'Course identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0B',
  }),
  resourceId: CourseResourceId.openapi({
    param: { name: 'resourceId', in: 'path', description: 'Course resource identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0C',
  }),
});

export const recordResourceViewRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/resources/{resourceId}/views',
  tags: ['CourseContent'],
  operationId: 'recordResourceView',
  security: [{ bearerAuth: [] }],
  request: { params: ResourceViewPathParams },
  responses: {
    201: {
      description: 'Resource view recorded for the calling user.',
      content: { 'application/json': { schema: CourseResourceViewEventResponse } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listResourceViewsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/resources/{resourceId}/views',
  tags: ['CourseContent'],
  operationId: 'listResourceViews',
  security: [{ bearerAuth: [] }],
  request: { params: ResourceViewPathParams },
  responses: {
    200: {
      description: 'Recorded resource views. Staff sees all; students see only their own.',
      content: { 'application/json': { schema: CourseResourceViewEventResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
