import { createRoute, z } from '@hono/zod-openapi';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationFrequency,
  NotificationPreference,
  NotificationRecord,
} from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const NotificationRecordResponse = NotificationRecord.openapi('NotificationRecord');
export const NotificationPreferenceResponse =
  NotificationPreference.openapi('NotificationPreference');

export const NotificationPathParams = TenantPathParams.extend({
  notificationId: z
    .string()
    .min(1)
    .openapi({
      param: {
        name: 'notificationId',
        in: 'path',
        description: 'Notification identifier.',
      },
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
});

export const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/notifications',
  tags: ['Notifications'],
  operationId: 'listNotifications',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Notifications for the authenticated user in the tenant.',
      content: {
        'application/json': {
          schema: NotificationRecordResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listNotificationPreferencesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/notifications/preferences',
  tags: ['Notifications'],
  operationId: 'listNotificationPreferences',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
  },
  responses: {
    200: {
      description: 'Notification preferences for the authenticated user in the tenant.',
      content: {
        'application/json': {
          schema: NotificationPreferenceResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const UpsertNotificationPreferenceBody = z
  .object({
    category: NotificationCategory.openapi({
      description: 'Notification category whose preference is being saved.',
      example: 'feedback_published',
    }),
    channel: NotificationChannel.openapi({
      description: 'Delivery channel: in_app, email, or push.',
      example: 'email',
    }),
    frequency: NotificationFrequency.openapi({
      description: 'Cadence for this category/channel.',
      example: 'immediate',
    }),
  })
  .strict();

export const upsertNotificationPreferenceRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/notifications/preferences',
  tags: ['Notifications'],
  operationId: 'upsertNotificationPreference',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpsertNotificationPreferenceBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Notification preference saved for the authenticated user.',
      content: {
        'application/json': {
          schema: NotificationPreferenceResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const markNotificationReadRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/notifications/{notificationId}/read',
  tags: ['Notifications'],
  operationId: 'markNotificationRead',
  security: [{ bearerAuth: [] }],
  request: {
    params: NotificationPathParams,
  },
  responses: {
    200: {
      description: 'Notification marked read for the authenticated user.',
      content: {
        'application/json': {
          schema: NotificationRecordResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
