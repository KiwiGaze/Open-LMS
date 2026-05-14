import { createRoute, z } from '@hono/zod-openapi';
import { Consent, ConsentActionType, ConsentScope, ConsentState } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const ConsentResponse = Consent.openapi('Consent');

export const RecordMyConsentBody = z
  .object({
    actionType: ConsentActionType,
    scope: ConsentScope,
    scopeId: z.string().min(1).max(64),
    state: z.enum(['granted', 'revoked']),
    expiresAt: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .transform((value) => (value ? new Date(value) : null)),
    evidence: z.string().min(1).max(2000).nullable().optional(),
  })
  .strict();

export const listMyConsentsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/me/consents',
  tags: ['Account'],
  operationId: 'listMyConsents',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description:
        'Consent history for the authenticated user in this tenant, ordered oldest-first by createdAt. The most recent matching record per (actionType, scope, scopeId) is treated as the current state by the AI policy evaluator.',
      content: {
        'application/json': {
          schema: ConsentResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const recordMyConsentRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/me/consents',
  tags: ['Account'],
  operationId: 'recordMyConsent',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RecordMyConsentBody,
        },
      },
    },
  },
  responses: {
    201: {
      description:
        'A new consent record was appended for the authenticated user. The consent table is append-only — the latest row per (actionType, scope, scopeId) wins.',
      content: {
        'application/json': {
          schema: ConsentResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export type RecordMyConsentInput = {
  actionType: z.infer<typeof ConsentActionType>;
  scope: z.infer<typeof ConsentScope>;
  scopeId: string;
  state: 'granted' | 'revoked';
  expiresAt: Date | null;
  evidence: string | null;
};

// Re-export for the response type consumers that need the runtime schema for parsing.
export { ConsentState };
