import { createRoute, z } from '@hono/zod-openapi';
import { AuditCategory, AuditLog, UserId } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const AuditLogResponse = AuditLog.openapi('AuditLog');

const AuditLogLimitQuery = z
  .string()
  .regex(/^[1-9]\d*$/, 'Limit must be an integer between 1 and 500.')
  .refine((value) => Number(value) <= 500, {
    message: 'Limit must be an integer between 1 and 500.',
  })
  .optional()
  .openapi({
    description: 'Maximum number of audit log rows to return. Defaults to 50.',
    example: '50',
  });

export const AuditLogQuery = z
  .object({
    category: AuditCategory.optional().openapi({
      description: 'Filter by audit category.',
      example: 'grade',
    }),
    action: z.string().min(1).max(120).optional().openapi({
      description: 'Filter by exact audit action.',
      example: 'change_grade',
    }),
    actorId: UserId.optional().openapi({
      description: 'Filter by actor user id.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE2V',
    }),
    resourceType: z.string().min(1).max(120).optional().openapi({
      description: 'Filter by exact audited resource type.',
      example: 'grade',
    }),
    resourceId: z.string().min(1).max(128).optional().openapi({
      description: 'Filter by exact audited resource id.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE2X',
    }),
    from: z.string().datetime().optional().openapi({
      description: 'Inclusive created-at range start as an ISO 8601 timestamp.',
      example: '2026-05-01T00:00:00.000Z',
    }),
    to: z.string().datetime().optional().openapi({
      description: 'Inclusive created-at range end as an ISO 8601 timestamp.',
      example: '2026-05-14T00:00:00.000Z',
    }),
    limit: AuditLogLimitQuery,
  })
  .refine(
    (query) =>
      query.from === undefined ||
      query.to === undefined ||
      new Date(query.from).getTime() <= new Date(query.to).getTime(),
    {
      message: 'The from timestamp must be before or equal to the to timestamp.',
      path: ['from'],
    },
  );

export const listAuditLogsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/audit-logs',
  tags: ['Audit'],
  operationId: 'listAuditLogs',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: AuditLogQuery,
  },
  responses: {
    200: {
      description: 'Tenant audit logs matching the requested filters. Staff-only.',
      content: {
        'application/json': {
          schema: AuditLogResponse.array(),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const exportAuditLogsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/audit-logs/export.csv',
  tags: ['Audit'],
  operationId: 'exportAuditLogsCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: AuditLogQuery,
  },
  responses: {
    200: {
      description: 'Tenant audit logs matching the requested filters as CSV. Staff-only.',
      content: {
        'text/csv': {
          schema: z.string().openapi({
            description: 'CSV body with one row per audit log.',
          }),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
