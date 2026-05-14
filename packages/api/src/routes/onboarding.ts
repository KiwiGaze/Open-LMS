import { createRoute, z } from '@hono/zod-openapi';
import { Tenant, TenantSlug } from '@openlms/contracts';
import { badRequestResponse, conflictResponse, unauthorizedResponse } from './responses.ts';

export const TenantResponse = Tenant.openapi('Tenant');

export const CreateInitialTenantBody = z
  .object({
    slug: TenantSlug.openapi({
      description: 'URL-safe institution identifier.',
      example: 'open-lms-academy',
    }),
    displayName: z.string().min(1).max(160).openapi({
      description: 'Human-readable institution name.',
      example: 'Open-LMS Academy',
    }),
  })
  .strict();

/**
 * `POST /api/v1/onboarding/create-tenant`
 *
 * Lets a newly signed-up user create their first institution. The caller
 * becomes its `institution_admin`. Subsequent tenants for the same user (or
 * other invites) should go through admin-driven flows, not this onboarding
 * endpoint.
 */
export const createInitialTenantRoute = createRoute({
  method: 'post',
  path: '/api/v1/onboarding/create-tenant',
  tags: ['Onboarding'],
  operationId: 'createInitialTenant',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateInitialTenantBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'The newly created tenant. The caller is its institution admin.',
      content: {
        'application/json': {
          schema: TenantResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    409: conflictResponse,
  },
});
