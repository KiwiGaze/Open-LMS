import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseMeeting,
  CourseMeetingId,
  CourseMeetingProvider,
  CourseMeetingStatus,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseMeetingResponse = CourseMeeting.openapi('CourseMeeting');

export const listCourseMeetingsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/meetings',
  tags: ['Meetings'],
  operationId: 'listCourseMeetings',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course meetings visible to course members.',
      content: {
        'application/json': {
          schema: CourseMeetingResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCourseMeetingBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Meeting title shown to learners.',
      example: 'Live workshop',
    }),
    description: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional description.',
      example: 'Synchronous workshop on rubrics and feedback.',
    }),
    provider: CourseMeetingProvider.openapi({
      description: 'Conferencing provider hosting the meeting.',
      example: 'zoom',
    }),
    externalUrl: z
      .string()
      .url()
      .max(2_048)
      .regex(/^https:\/\//)
      .openapi({
        description: 'HTTPS URL for joining the meeting (provider-issued).',
        example: 'https://example.zoom.us/j/123456789',
      }),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Meeting start time in ISO 8601 format.',
        example: '2026-09-10T15:00:00.000Z',
      }),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional meeting end time. Must be after startsAt.',
        example: '2026-09-10T16:30:00.000Z',
      }),
    recordingUrl: z
      .string()
      .url()
      .max(2_048)
      .regex(/^https:\/\//)
      .nullable()
      .default(null)
      .openapi({
        description: 'Optional HTTPS URL for the provider recording file.',
        example: 'https://media.example.edu/recordings/workshop.mp4',
      }),
    playbackUrl: z
      .string()
      .url()
      .max(2_048)
      .regex(/^https:\/\//)
      .nullable()
      .default(null)
      .openapi({
        description: 'Optional HTTPS URL for learner playback after the meeting ends.',
        example: 'https://media.example.edu/playback/workshop',
      }),
    status: CourseMeetingStatus.openapi({
      description: 'Meeting lifecycle status.',
      example: 'scheduled',
    }),
  })
  .strict();

export const createCourseMeetingRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/meetings',
  tags: ['Meetings'],
  operationId: 'createCourseMeeting',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseMeetingBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course meeting.',
      content: {
        'application/json': {
          schema: CourseMeetingResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CourseMeetingPathParams = CourseAssignmentPathParams.extend({
  meetingId: CourseMeetingId.openapi({
    param: {
      name: 'meetingId',
      in: 'path',
      description: 'Course meeting identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE92',
  }),
});

export const UpdateCourseMeetingBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Meeting title shown to learners.',
      example: 'Live workshop (rescheduled)',
    }),
    description: z.string().min(1).max(2_000).nullable().openapi({
      description: 'Optional description.',
      example: null,
    }),
    provider: CourseMeetingProvider.openapi({
      description: 'Conferencing provider hosting the meeting.',
      example: 'zoom',
    }),
    externalUrl: z
      .string()
      .url()
      .max(2_048)
      .regex(/^https:\/\//)
      .openapi({
        description: 'HTTPS URL for joining the meeting (provider-issued).',
        example: 'https://example.zoom.us/j/123456789',
      }),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Meeting start time in ISO 8601 format.',
        example: '2026-09-10T15:00:00.000Z',
      }),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .openapi({
        description: 'Optional meeting end time. Must be after startsAt.',
        example: '2026-09-10T16:30:00.000Z',
      }),
    recordingUrl: z
      .string()
      .url()
      .max(2_048)
      .regex(/^https:\/\//)
      .nullable()
      .default(null)
      .openapi({
        description: 'Optional HTTPS URL for the provider recording file.',
        example: 'https://media.example.edu/recordings/workshop.mp4',
      }),
    playbackUrl: z
      .string()
      .url()
      .max(2_048)
      .regex(/^https:\/\//)
      .nullable()
      .default(null)
      .openapi({
        description: 'Optional HTTPS URL for learner playback after the meeting ends.',
        example: 'https://media.example.edu/playback/workshop',
      }),
    status: CourseMeetingStatus.openapi({
      description: 'Meeting lifecycle status.',
      example: 'scheduled',
    }),
  })
  .strict();

export const updateCourseMeetingRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/meetings/{meetingId}',
  tags: ['Meetings'],
  operationId: 'updateCourseMeeting',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseMeetingPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseMeetingBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course meeting.',
      content: {
        'application/json': {
          schema: CourseMeetingResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseMeetingRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/meetings/{meetingId}',
  tags: ['Meetings'],
  operationId: 'deleteCourseMeeting',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseMeetingPathParams,
  },
  responses: {
    204: {
      description: 'Course meeting deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
