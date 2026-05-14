import { createRoute, z } from '@hono/zod-openapi';
import { Locale, Timezone, User } from '@openlms/contracts';
import { badRequestResponse, unauthorizedResponse } from './responses.ts';

export const UserResponse = User.openapi('User');

export const getCurrentUserRoute = createRoute({
  method: 'get',
  path: '/api/v1/me',
  tags: ['Account'],
  operationId: 'getCurrentUser',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Profile information for the authenticated user.',
      content: {
        'application/json': {
          schema: UserResponse,
        },
      },
    },
    401: unauthorizedResponse,
  },
});

export const UpdateCurrentUserBody = z
  .object({
    displayName: z.string().min(1).max(120).optional().openapi({
      description: 'Display name shown to other users.',
      example: 'Jordan Lee',
    }),
    locale: Locale.nullable().optional().openapi({
      description: 'BCP 47 locale tag (e.g. "en-US"). Pass null to clear.',
      example: 'en-US',
    }),
    timezone: Timezone.nullable().optional().openapi({
      description: 'IANA time zone identifier (e.g. "America/New_York"). Pass null to clear.',
      example: 'America/New_York',
    }),
  })
  .strict()
  .refine((value) => value.displayName !== undefined || 'locale' in value || 'timezone' in value, {
    message: 'At least one of displayName, locale, or timezone must be provided.',
  });

export const updateCurrentUserRoute = createRoute({
  method: 'patch',
  path: '/api/v1/me',
  tags: ['Account'],
  operationId: 'updateCurrentUser',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCurrentUserBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated profile for the authenticated user.',
      content: {
        'application/json': {
          schema: UserResponse,
        },
      },
    },
    401: unauthorizedResponse,
  },
});

export const deleteCurrentUserRoute = createRoute({
  method: 'delete',
  path: '/api/v1/me',
  tags: ['Account'],
  operationId: 'deleteCurrentUser',
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description:
        'The authenticated account was deleted. Academic records keep a preserved anonymized user reference.',
    },
    401: unauthorizedResponse,
  },
});
