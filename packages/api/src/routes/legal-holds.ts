import { createRoute, z } from '@hono/zod-openapi';
import { UserId, UserLegalHold, UserLegalHoldId } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const UserLegalHoldResponse = UserLegalHold.openapi('UserLegalHold');

export const UserLegalHoldStatusQuery = z
  .enum(['active', 'released', 'all'])
  .default('active')
  .openapi({
    description: 'Legal hold lifecycle filter. Defaults to active holds.',
    example: 'active',
  });

export const ListUserLegalHoldsQuery = z.object({
  userId: UserId.optional().openapi({
    description: 'Filter legal holds by user.',
    example: '01J9QW7B6N5W2YH3D3A1V0KEF2',
  }),
  status: UserLegalHoldStatusQuery.optional(),
});

export const CreateUserLegalHoldBody = z
  .object({
    userId: UserId.openapi({
      description: 'User who is subject to the hold.',
      example: '01J9QW7B6N5W2YH3D3A1V0KEF2',
    }),
    reason: z.string().min(1).max(1000).openapi({
      description: 'Reason the legal hold is required.',
      example: 'Active grade appeal retention',
    }),
  })
  .strict();

export const UserLegalHoldPathParams = TenantPathParams.extend({
  legalHoldId: UserLegalHoldId.openapi({
    param: {
      name: 'legalHoldId',
      in: 'path',
      description: 'User legal hold identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KEF3',
  }),
});

export const listUserLegalHoldsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/legal-holds',
  tags: ['Compliance'],
  operationId: 'listUserLegalHolds',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: ListUserLegalHoldsQuery,
  },
  responses: {
    200: {
      description: 'Tenant legal holds. Institution-admin only.',
      content: {
        'application/json': {
          schema: UserLegalHoldResponse.array(),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createUserLegalHoldRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/legal-holds',
  tags: ['Compliance'],
  operationId: 'createUserLegalHold',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateUserLegalHoldBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Legal hold created.',
      content: {
        'application/json': {
          schema: UserLegalHoldResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const releaseUserLegalHoldRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/legal-holds/{legalHoldId}/release',
  tags: ['Compliance'],
  operationId: 'releaseUserLegalHold',
  security: [{ bearerAuth: [] }],
  request: {
    params: UserLegalHoldPathParams,
  },
  responses: {
    200: {
      description: 'Legal hold released.',
      content: {
        'application/json': {
          schema: UserLegalHoldResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
