import { createRoute, z } from '@hono/zod-openapi';
import { UserPushToken, UserPushTokenId, UserPushTokenPlatform } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from './responses.ts';

export const UserPushTokenResponse = UserPushToken.openapi('UserPushToken');

export const RegisterPushTokenBody = z
  .object({
    platform: UserPushTokenPlatform.openapi({
      description: 'Mobile or web platform issuing the push token.',
      example: 'ios',
    }),
    token: z.string().min(1).max(4096).openapi({
      description: 'Opaque push token provided by APNs/FCM/Web Push.',
      example: 'eDjk8...redacted',
    }),
    locale: z.string().min(2).max(16).nullable().openapi({
      description: 'Device locale (BCP-47).',
      example: 'en-US',
    }),
    appVersion: z.string().min(1).max(64).nullable().openapi({
      description: 'App version string for diagnostics.',
      example: '1.4.2',
    }),
  })
  .strict();

export const PushTokenPathParams = TenantPathParams.extend({
  tokenId: UserPushTokenId.openapi({
    param: { name: 'tokenId', in: 'path', description: 'Push token identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3T',
  }),
});

export const listMyPushTokensRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/push-tokens',
  tags: ['Notifications'],
  operationId: 'listMyPushTokens',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Push tokens registered for the authenticated user in this tenant.',
      content: {
        'application/json': {
          schema: UserPushTokenResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const registerMyPushTokenRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/push-tokens',
  tags: ['Notifications'],
  operationId: 'registerMyPushToken',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RegisterPushTokenBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Push token registered (upserted by tenant/user/platform/token).',
      content: {
        'application/json': {
          schema: UserPushTokenResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const revokeMyPushTokenRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/push-tokens/{tokenId}',
  tags: ['Notifications'],
  operationId: 'revokeMyPushToken',
  security: [{ bearerAuth: [] }],
  request: {
    params: PushTokenPathParams,
  },
  responses: {
    204: {
      description: 'Push token revoked.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
