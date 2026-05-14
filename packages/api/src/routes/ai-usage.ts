import { createRoute, z } from '@hono/zod-openapi';
import { AiAction, AiUsageByAction, AiUsageSummary } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const AiActionResponse = AiAction.openapi('AiAction');
export const AiUsageSummaryResponse = AiUsageSummary.openapi('AiUsageSummary');
export const AiUsageByActionResponse = AiUsageByAction.openapi('AiUsageByAction');

export const listAiActionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/ai/actions',
  tags: ['AI'],
  operationId: 'listAiActions',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'AI action registry available to this tenant. Staff-only.',
      content: {
        'application/json': {
          schema: AiActionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const AiUsageSummaryQuery = z
  .object({
    from: z.string().datetime().openapi({
      description: 'Inclusive range start as an ISO 8601 timestamp.',
      example: '2026-04-01T00:00:00.000Z',
    }),
    to: z.string().datetime().openapi({
      description: 'Inclusive range end as an ISO 8601 timestamp.',
      example: '2026-05-01T00:00:00.000Z',
    }),
  })
  .refine((query) => new Date(query.from).getTime() <= new Date(query.to).getTime(), {
    message: 'The from timestamp must be before or equal to the to timestamp.',
    path: ['from'],
  });

export const listAiUsageByActionRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/ai/usage-by-action',
  tags: ['AI'],
  operationId: 'listAiUsageByAction',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: AiUsageSummaryQuery,
  },
  responses: {
    200: {
      description: 'AI generation telemetry grouped by action identifier. Staff-only.',
      content: {
        'application/json': {
          schema: AiUsageByActionResponse.array(),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const getAiUsageSummaryRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/ai/usage-summary',
  tags: ['AI'],
  operationId: 'getAiUsageSummary',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: AiUsageSummaryQuery,
  },
  responses: {
    200: {
      description: 'Aggregated AI generation telemetry for the requested window. Staff-only.',
      content: {
        'application/json': {
          schema: AiUsageSummaryResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
