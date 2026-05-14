import { createRoute, z } from '@hono/zod-openapi';
import { CatalogCourse } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';

export const CatalogCourseResponse = CatalogCourse.openapi('CatalogCourse');

export const CatalogCoursesQuery = z.object({
  blueprint: z.enum(['true', 'false']).optional().openapi({
    description:
      'When present, narrows the catalog to courses marked (or not marked) as blueprints.',
    example: 'true',
  }),
  catalogCategory: z.string().min(1).max(120).optional().openapi({
    description: 'Optional catalog category filter, such as a department or subject family.',
    example: 'Writing',
  }),
  academicTerm: z.string().min(1).max(64).optional().openapi({
    description: 'Optional academic term filter.',
    example: '2026 Fall',
  }),
});

export const listCatalogCoursesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/catalog/courses',
  tags: ['Catalog'],
  operationId: 'listCatalogCourses',
  request: {
    params: TenantPathParams,
    query: CatalogCoursesQuery,
  },
  responses: {
    200: {
      description: 'Public catalog: active courses marked as catalog-listed in this tenant.',
      content: {
        'application/json': {
          schema: CatalogCourseResponse.array(),
        },
      },
    },
  },
});
