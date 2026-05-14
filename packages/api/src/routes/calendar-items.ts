import { createRoute, z } from '@hono/zod-openapi';
import { CalendarItem } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const CalendarItemResponse = CalendarItem.openapi('CalendarItem');

export const CalendarItemsQuery = z
  .object({
    from: z.string().datetime().openapi({
      description: 'Inclusive range start as an ISO 8601 timestamp.',
      example: '2026-05-11T00:00:00.000Z',
    }),
    to: z.string().datetime().openapi({
      description: 'Inclusive range end as an ISO 8601 timestamp.',
      example: '2026-05-18T00:00:00.000Z',
    }),
  })
  .refine((query) => new Date(query.from).getTime() <= new Date(query.to).getTime(), {
    message: 'The from timestamp must be before or equal to the to timestamp.',
    path: ['from'],
  });

export const listCalendarItemsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/calendar-items',
  tags: ['Calendar'],
  operationId: 'listCalendarItems',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: CalendarItemsQuery,
  },
  responses: {
    200: {
      description: 'Calendar items visible to the authenticated user in the tenant.',
      content: {
        'application/json': {
          schema: CalendarItemResponse.array(),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const exportCalendarIcsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/calendar.ics',
  tags: ['Calendar'],
  operationId: 'exportCalendarIcs',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    query: CalendarItemsQuery,
  },
  responses: {
    200: {
      description: 'RFC 5545 VCALENDAR feed of calendar items for the authenticated user.',
      content: {
        'text/calendar': {
          schema: z.string().openapi({
            description: 'iCalendar (.ics) feed body.',
          }),
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
