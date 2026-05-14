import { createRoute, z } from '@hono/zod-openapi';
import { WebhookEventTopic, WebhookSubscription, WebhookSubscriptionId } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const WebhookSubscriptionResponse = WebhookSubscription.openapi('WebhookSubscription');

const WebhookSubscriptionStatus = z.enum(['enabled', 'disabled']);
const HttpsEndpointUrl = z
  .string()
  .regex(/^https:\/\//, { message: 'Webhook endpoint URL must use HTTPS.' })
  .url()
  .max(2048);

export const CreateWebhookSubscriptionBody = z
  .object({
    name: z.string().min(1).max(120).openapi({
      description: 'Operator-facing subscription name.',
      example: 'Student systems webhook',
    }),
    endpointUrl: HttpsEndpointUrl.openapi({
      description: 'HTTPS endpoint that receives webhook deliveries.',
      example: 'https://hooks.example.edu/open-lms',
    }),
    topics: WebhookEventTopic.array().min(1).max(50).openapi({
      description: 'Outbox topics to deliver to this subscription.',
      example: ['grade.lifecycle', 'assignment.feedback'],
    }),
    status: WebhookSubscriptionStatus.openapi({
      description: 'Whether this subscription should receive deliveries.',
      example: 'enabled',
    }),
    signingSecret: z.string().min(1).max(4096).openapi({
      description: 'Shared secret used to sign outbound webhook deliveries.',
      example: 'plain-webhook-secret',
    }),
  })
  .strict();

export const UpdateWebhookSubscriptionBody = z
  .object({
    name: z.string().min(1).max(120).openapi({
      description: 'Operator-facing subscription name.',
      example: 'Student systems webhook',
    }),
    endpointUrl: HttpsEndpointUrl.openapi({
      description: 'HTTPS endpoint that receives webhook deliveries.',
      example: 'https://hooks.example.edu/open-lms',
    }),
    topics: WebhookEventTopic.array().min(1).max(50).openapi({
      description: 'Outbox topics to deliver to this subscription.',
      example: ['grade.lifecycle', 'assignment.feedback'],
    }),
    status: WebhookSubscriptionStatus.openapi({
      description: 'Whether this subscription should receive deliveries.',
      example: 'enabled',
    }),
    signingSecret: z.string().min(1).max(4096).optional().openapi({
      description: 'Optional shared secret rotation value.',
      example: 'rotated-webhook-secret',
    }),
  })
  .strict();

export const WebhookSubscriptionPathParams = TenantPathParams.extend({
  webhookSubscriptionId: WebhookSubscriptionId.openapi({
    param: {
      name: 'webhookSubscriptionId',
      in: 'path',
      description: 'Webhook subscription identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KWA2',
  }),
});

export const listWebhookSubscriptionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/webhook-subscriptions',
  tags: ['Integrations'],
  operationId: 'listWebhookSubscriptions',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Tenant webhook subscriptions. institution_admin only.',
      content: {
        'application/json': {
          schema: WebhookSubscriptionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createWebhookSubscriptionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/webhook-subscriptions',
  tags: ['Integrations'],
  operationId: 'createWebhookSubscription',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateWebhookSubscriptionBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created webhook subscription. institution_admin only.',
      content: {
        'application/json': {
          schema: WebhookSubscriptionResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const updateWebhookSubscriptionRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/webhook-subscriptions/{webhookSubscriptionId}',
  tags: ['Integrations'],
  operationId: 'updateWebhookSubscription',
  security: [{ bearerAuth: [] }],
  request: {
    params: WebhookSubscriptionPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateWebhookSubscriptionBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated webhook subscription. institution_admin only.',
      content: {
        'application/json': {
          schema: WebhookSubscriptionResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteWebhookSubscriptionRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/webhook-subscriptions/{webhookSubscriptionId}',
  tags: ['Integrations'],
  operationId: 'deleteWebhookSubscription',
  security: [{ bearerAuth: [] }],
  request: {
    params: WebhookSubscriptionPathParams,
  },
  responses: {
    204: {
      description: 'Deleted webhook subscription. institution_admin only.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
