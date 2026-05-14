import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseCalendarEvent,
  CourseCalendarEventId,
  CourseCalendarEventOccurrence,
  CourseCalendarEventVisibility,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseCalendarEventResponse = CourseCalendarEvent.openapi('CourseCalendarEvent');
export const CourseCalendarEventOccurrenceResponse = CourseCalendarEventOccurrence.openapi(
  'CourseCalendarEventOccurrence',
);

export const CourseCalendarEventOccurrencesQuery = z
  .object({
    windowStart: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Window start (inclusive) in ISO 8601 format.',
        example: '2026-05-01T00:00:00.000Z',
      }),
    windowEnd: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description:
          'Window end (inclusive) in ISO 8601 format. Must be no more than 366 days after windowStart.',
        example: '2026-05-31T23:59:59.999Z',
      }),
  })
  .strict()
  .superRefine((value, context) => {
    const maxWindowMs = 366 * 24 * 60 * 60 * 1000;
    if (value.windowEnd.getTime() <= value.windowStart.getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'windowEnd must be after windowStart.',
        path: ['windowEnd'],
      });
    }
    if (value.windowEnd.getTime() - value.windowStart.getTime() > maxWindowMs) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Window may not exceed 366 days.',
        path: ['windowEnd'],
      });
    }
  });

export const listCourseCalendarEventOccurrencesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events/occurrences',
  tags: ['Calendar'],
  operationId: 'listCourseCalendarEventOccurrences',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: CourseCalendarEventOccurrencesQuery,
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Expanded calendar event occurrences within the requested window.',
      content: {
        'application/json': {
          schema: CourseCalendarEventOccurrenceResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCourseCalendarEventsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events',
  tags: ['Calendar'],
  operationId: 'listCourseCalendarEvents',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course calendar events visible to course members.',
      content: {
        'application/json': {
          schema: CourseCalendarEventResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseCalendarEventBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Event title shown on the calendar.',
      example: 'Weekly workshop',
    }),
    description: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional description.',
      example: 'Live writing studio for evidence and reasoning.',
    }),
    location: z.string().min(1).max(180).nullable().openapi({
      description: 'Optional location (physical or virtual).',
      example: 'Room 204',
    }),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Event start time in ISO 8601 format.',
        example: '2026-09-10T15:00:00.000Z',
      }),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional event end time in ISO 8601 format. Must be after startsAt.',
        example: '2026-09-10T16:30:00.000Z',
      }),
    visibility: CourseCalendarEventVisibility.openapi({
      description: 'Lifecycle status for the event.',
      example: 'published',
    }),
    recurrenceRule: z.string().min(1).max(1_000).nullable().openapi({
      description: 'Optional RRULE-style recurrence string (e.g. FREQ=WEEKLY;COUNT=10).',
      example: 'FREQ=WEEKLY;COUNT=10',
    }),
  })
  .strict();

export const createCourseCalendarEventRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events',
  tags: ['Calendar'],
  operationId: 'createCourseCalendarEvent',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseCalendarEventBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course calendar event.',
      content: {
        'application/json': {
          schema: CourseCalendarEventResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CourseCalendarEventPathParams = CourseAssignmentPathParams.extend({
  eventId: CourseCalendarEventId.openapi({
    param: {
      name: 'eventId',
      in: 'path',
      description: 'Course calendar event identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE91',
  }),
});

export const UpdateCourseCalendarEventBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Event title shown on the calendar.',
      example: 'Weekly workshop (refreshed)',
    }),
    description: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional description.',
      example: null,
    }),
    location: z.string().min(1).max(180).nullable().openapi({
      description: 'Optional location (physical or virtual).',
      example: 'Room 204',
    }),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Event start time in ISO 8601 format.',
        example: '2026-09-10T15:00:00.000Z',
      }),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional event end time in ISO 8601 format. Must be after startsAt.',
        example: '2026-09-10T16:30:00.000Z',
      }),
    visibility: CourseCalendarEventVisibility.openapi({
      description: 'Lifecycle status for the event.',
      example: 'published',
    }),
    recurrenceRule: z.string().min(1).max(1_000).nullable().openapi({
      description: 'Optional RRULE-style recurrence string.',
      example: 'FREQ=WEEKLY;COUNT=10',
    }),
  })
  .strict();

export const updateCourseCalendarEventRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events/{eventId}',
  tags: ['Calendar'],
  operationId: 'updateCourseCalendarEvent',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCalendarEventPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseCalendarEventBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course calendar event.',
      content: {
        'application/json': {
          schema: CourseCalendarEventResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseCalendarEventRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/calendar-events/{eventId}',
  tags: ['Calendar'],
  operationId: 'deleteCourseCalendarEvent',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCalendarEventPathParams,
  },
  responses: {
    204: {
      description: 'Course calendar event deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
