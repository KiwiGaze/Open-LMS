import { createRoute, z } from '@hono/zod-openapi';

export const HealthResponse = z
  .object({
    status: z.literal('ok'),
    service: z.literal('open-lms-api'),
  })
  .openapi('HealthResponse');

export const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  operationId: 'getHealth',
  responses: {
    200: {
      description: 'API process is running.',
      content: {
        'application/json': {
          schema: HealthResponse,
        },
      },
    },
  },
});
