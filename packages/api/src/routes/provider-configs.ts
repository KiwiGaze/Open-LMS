import { createRoute } from '@hono/zod-openapi';
import { ProviderConfigSummary } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from './responses.ts';

export const ProviderConfigSummaryResponse = ProviderConfigSummary.openapi('ProviderConfigSummary');

export const getProviderConfigRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/provider-config',
  tags: ['AI'],
  operationId: 'getProviderConfig',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description:
        'AI provider config for this tenant, with the encrypted API key redacted. institution_admin only.',
      content: {
        'application/json': {
          schema: ProviderConfigSummaryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
