import { createRoute, z } from '@hono/zod-openapi';
import {
  AttendanceRecord,
  AttendanceRecordStatus,
  AttendanceSession,
  AttendanceSessionId,
  AttendanceSessionStatus,
  UserId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const AttendanceSessionResponse = AttendanceSession.openapi('AttendanceSession');
export const AttendanceRecordResponse = AttendanceRecord.openapi('AttendanceRecord');
export const CreateAttendanceSessionBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Attendance session title.',
      example: 'Week 2 seminar',
    }),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Session start time.',
        example: '2026-05-11T00:00:00.000Z',
      }),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'Session end time. Must be after startsAt.',
        example: '2026-05-11T01:00:00.000Z',
      }),
    status: AttendanceSessionStatus.openapi({
      description: 'Initial attendance session state.',
      example: 'scheduled',
    }),
  })
  .strict()
  .refine((body) => body.endsAt.getTime() > body.startsAt.getTime(), {
    message: 'endsAt must be after startsAt.',
    path: ['endsAt'],
  });
export const RecordAttendanceBody = z
  .object({
    status: AttendanceRecordStatus.openapi({
      description: 'Attendance state to record for the student.',
      example: 'late',
    }),
    note: z.string().min(1).max(2000).nullable().optional().openapi({
      description: 'Optional staff note explaining the attendance mark.',
      example: 'Arrived after the opening activity.',
    }),
  })
  .strict();

export const CourseAttendanceSessionPathParams = CourseAssignmentPathParams.extend({
  sessionId: AttendanceSessionId.openapi({
    param: {
      name: 'sessionId',
      in: 'path',
      description: 'Attendance session identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE4C',
  }),
});

export const CourseAttendanceRecordPathParams = CourseAttendanceSessionPathParams.extend({
  studentId: UserId.openapi({
    param: {
      name: 'studentId',
      in: 'path',
      description: 'Student user identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE84',
  }),
});

export const listAttendanceSessionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions',
  tags: ['Attendance'],
  operationId: 'listAttendanceSessions',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Attendance sessions visible to the authenticated user.',
      content: {
        'application/json': {
          schema: AttendanceSessionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createAttendanceSessionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions',
  tags: ['Attendance'],
  operationId: 'createAttendanceSession',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateAttendanceSessionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created attendance session.',
      content: {
        'application/json': {
          schema: AttendanceSessionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listAttendanceRecordsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records',
  tags: ['Attendance'],
  operationId: 'listAttendanceRecords',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAttendanceSessionPathParams,
  },
  responses: {
    200: {
      description: 'Attendance records visible to the authenticated user.',
      content: {
        'application/json': {
          schema: AttendanceRecordResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const recordAttendanceRecordRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/attendance-sessions/{sessionId}/records/{studentId}',
  tags: ['Attendance'],
  operationId: 'recordAttendanceRecord',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAttendanceRecordPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RecordAttendanceBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Recorded attendance mark for the student.',
      content: {
        'application/json': {
          schema: AttendanceRecordResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
