import { createRoute, z } from '@hono/zod-openapi';
import { FeatureFlagKey, TenantFeatureFlag } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const TenantFeatureFlagResponse = TenantFeatureFlag.openapi('TenantFeatureFlag');

export const TenantFeatureFlagPathParams = TenantPathParams.extend({
  key: FeatureFlagKey.openapi({
    param: {
      name: 'key',
      in: 'path',
      description: 'Tenant feature flag key.',
    },
    example: 'gradebook.final_grades',
  }),
});

export const UpsertTenantFeatureFlagBody = z
  .object({
    enabled: z.boolean().openapi({
      description: 'Whether this tenant rollout flag is enabled.',
      example: true,
    }),
    description: z.string().min(1).max(500).nullable().default(null).openapi({
      description: 'Optional operator-facing reason or rollout note.',
      example: 'Enable final grade exports for pilot tenants.',
    }),
  })
  .strict();

export const listTenantFeatureFlagsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/feature-flags',
  tags: ['Tenants'],
  operationId: 'listTenantFeatureFlags',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Tenant-scoped feature flags. institution_admin only.',
      content: {
        'application/json': {
          schema: TenantFeatureFlagResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const upsertTenantFeatureFlagRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/feature-flags/{key}',
  tags: ['Tenants'],
  operationId: 'upsertTenantFeatureFlag',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantFeatureFlagPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpsertTenantFeatureFlagBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Saved tenant-scoped feature flag. institution_admin only.',
      content: {
        'application/json': {
          schema: TenantFeatureFlagResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const deleteTenantFeatureFlagRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/feature-flags/{key}',
  tags: ['Tenants'],
  operationId: 'deleteTenantFeatureFlag',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantFeatureFlagPathParams,
  },
  responses: {
    204: {
      description: 'Deleted tenant-scoped feature flag. institution_admin only.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
