import { createRoute, z } from '@hono/zod-openapi';
import { MembershipId, Tenant, TenantMembership, TenantRole } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const TenantResponse = Tenant.openapi('Tenant');
export const TenantMembershipResponse = TenantMembership.openapi('TenantMembership');
const FileStorageQuotaLimit = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const UpdateTenantFileStorageQuotasBody = z
  .object({
    storageByteLimit: FileStorageQuotaLimit.nullable().openapi({
      description: 'Tenant-wide file storage limit in bytes. Null means unlimited.',
      example: 1073741824,
    }),
    defaultUserStorageByteLimit: FileStorageQuotaLimit.nullable().openapi({
      description: 'Default per-user file storage limit in bytes. Null means unlimited.',
      example: 1048576,
    }),
  })
  .strict();

export const listTenantsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants',
  tags: ['Tenants'],
  operationId: 'listTenants',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Tenants visible to the authenticated user.',
      content: {
        'application/json': {
          schema: TenantResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
  },
});

export const listTenantMembersRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/members',
  tags: ['Tenants'],
  operationId: 'listTenantMembers',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Tenant memberships visible to tenant staff.',
      content: {
        'application/json': {
          schema: TenantMembershipResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const updateTenantFileStorageQuotasRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/file-storage-quotas',
  tags: ['Tenants'],
  operationId: 'updateTenantFileStorageQuotas',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateTenantFileStorageQuotasBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated tenant file storage quota policy. institution_admin only.',
      content: {
        'application/json': {
          schema: TenantResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const TenantMembershipPathParams = TenantPathParams.extend({
  membershipId: MembershipId.openapi({
    param: {
      name: 'membershipId',
      in: 'path',
      description: 'Tenant membership identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KEB3',
  }),
});

export const UpdateTenantMembershipBody = z
  .object({
    role: TenantRole.openapi({
      description: 'Role to set on this tenant membership.',
      example: 'instructor',
    }),
  })
  .strict();

export const updateTenantMembershipRoute = createRoute({
  method: 'patch',
  path: '/api/v1/tenants/{tenantId}/memberships/{membershipId}',
  tags: ['Tenants'],
  operationId: 'updateTenantMembership',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantMembershipPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateTenantMembershipBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated tenant membership.',
      content: {
        'application/json': {
          schema: TenantMembershipResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});
