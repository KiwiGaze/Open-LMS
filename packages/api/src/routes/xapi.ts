import { createRoute, z } from '@hono/zod-openapi';
import { TenantId, XapiStatement, XapiStatementIngest } from '@openlms/contracts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const XapiTenantPathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
});

export const XapiStatementIngestBody = XapiStatementIngest.openapi('XapiStatementIngest');
export const XapiStatementResponse = XapiStatement.openapi('XapiStatement');

export const ingestXapiStatementRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/xapi/statements',
  tags: ['Integrations'],
  operationId: 'ingestXapiStatement',
  security: [{ bearerAuth: [] }],
  request: {
    params: XapiTenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': { schema: XapiStatementIngestBody },
      },
    },
  },
  responses: {
    201: {
      description: 'xAPI statement accepted and stored for this tenant.',
      content: { 'application/json': { schema: XapiStatementResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
