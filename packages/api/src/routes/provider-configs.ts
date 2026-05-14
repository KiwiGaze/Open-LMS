import { createRoute, z } from '@hono/zod-openapi';
import {
  AiProviderType,
  ModelPreferences,
  ProviderBaseUrl,
  ProviderCapabilities,
  ProviderConfigSummary,
  ProviderQuota,
} from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const ProviderConfigSummaryResponse = ProviderConfigSummary.openapi('ProviderConfigSummary');

export const UpsertProviderConfigBody = z
  .object({
    providerType: AiProviderType,
    baseUrl: ProviderBaseUrl.nullable(),
    apiKey: z
      .string()
      .min(1)
      .max(2048)
      .optional()
      .describe('Plaintext API key. Required on first create; optional on subsequent updates.'),
    modelPreferences: ModelPreferences,
    capabilities: ProviderCapabilities,
    quota: ProviderQuota,
  })
  .strict()
  .openapi('UpsertProviderConfigBody');

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

export const upsertProviderConfigRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/provider-config',
  tags: ['AI'],
  operationId: 'upsertProviderConfig',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpsertProviderConfigBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Saved AI provider config (encrypted key redacted). institution_admin only.',
      content: {
        'application/json': {
          schema: ProviderConfigSummaryResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const deleteProviderConfigRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/provider-config',
  tags: ['AI'],
  operationId: 'deleteProviderConfig',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    204: {
      description: 'AI provider config deleted. institution_admin only.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
