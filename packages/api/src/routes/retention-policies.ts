import { createRoute, z } from '@hono/zod-openapi';
import { RetentionPolicy, RetentionPolicyTargetType } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const RetentionPolicyResponse = RetentionPolicy.openapi('RetentionPolicy');

export const RetentionPolicyPathParams = TenantPathParams.extend({
  targetType: RetentionPolicyTargetType.openapi({
    param: {
      name: 'targetType',
      in: 'path',
      description: 'Retention policy target type.',
    },
    example: 'deleted_user',
  }),
});

export const UpsertRetentionPolicyBody = z
  .object({
    retainDays: z.number().int().min(0).max(3650).openapi({
      description: 'Number of days to preserve target records after deletion.',
      example: 365,
    }),
  })
  .strict();

export const listRetentionPoliciesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/retention-policies',
  tags: ['Compliance'],
  operationId: 'listRetentionPolicies',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Tenant retention policies. Institution-admin only.',
      content: {
        'application/json': {
          schema: RetentionPolicyResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const upsertRetentionPolicyRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/retention-policies/{targetType}',
  tags: ['Compliance'],
  operationId: 'upsertRetentionPolicy',
  security: [{ bearerAuth: [] }],
  request: {
    params: RetentionPolicyPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpsertRetentionPolicyBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Retention policy saved.',
      content: {
        'application/json': {
          schema: RetentionPolicyResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
