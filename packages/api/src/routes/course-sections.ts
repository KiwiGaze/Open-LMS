import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseSection,
  CourseSectionId,
  CourseSectionMeetingDay,
  CourseSectionStatus,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseSectionResponse = CourseSection.openapi('CourseSection');
export const CreateCourseSectionBody = z
  .object({
    name: z.string().min(1).max(120).openapi({
      description: 'Course section name.',
      example: 'Section B',
    }),
    status: CourseSectionStatus.openapi({
      description: 'Whether the section is active or archived.',
      example: 'active',
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position for the section within the course.',
      example: 1,
    }),
    meetingDays: z
      .array(CourseSectionMeetingDay)
      .default([])
      .openapi({
        description: 'Weekdays when this section meets.',
        example: ['monday', 'wednesday'],
      }),
    meetingStartTime: z
      .string()
      .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)
      .nullable()
      .default(null)
      .openapi({
        description: 'Section meeting start time in 24-hour HH:MM format.',
        example: '09:30',
      }),
    meetingEndTime: z
      .string()
      .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)
      .nullable()
      .default(null)
      .openapi({
        description: 'Section meeting end time in 24-hour HH:MM format.',
        example: '10:45',
      }),
    location: z.string().min(1).max(255).nullable().default(null).openapi({
      description: 'Classroom, campus location, or meeting place for this section.',
      example: 'Room 204',
    }),
  })
  .strict()
  .superRefine((section, context) => {
    const hasMeetingDays = section.meetingDays.length > 0;
    const hasStart = section.meetingStartTime !== null;
    const hasEnd = section.meetingEndTime !== null;

    if (!(hasMeetingDays === hasStart && hasStart === hasEnd)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Section meeting days and time range must be supplied together.',
        path: ['meetingDays'],
      });
    }

    if (
      section.meetingStartTime !== null &&
      section.meetingEndTime !== null &&
      section.meetingEndTime <= section.meetingStartTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Section meeting end time must be after the start time.',
        path: ['meetingEndTime'],
      });
    }
  });

export const listCourseSectionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections',
  tags: ['Course Sections'],
  operationId: 'listCourseSections',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course sections visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseSectionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createCourseSectionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections',
  tags: ['Course Sections'],
  operationId: 'createCourseSection',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseSectionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course section.',
      content: {
        'application/json': {
          schema: CourseSectionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CourseSectionPathParams = CourseAssignmentPathParams.extend({
  courseSectionId: CourseSectionId.openapi({
    param: {
      name: 'courseSectionId',
      in: 'path',
      description: 'Course section identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3E',
  }),
});

export const UpdateCourseSectionBody = CreateCourseSectionBody;

export const updateCourseSectionRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{courseSectionId}',
  tags: ['Course Sections'],
  operationId: 'updateCourseSection',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSectionPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseSectionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course section.',
      content: {
        'application/json': {
          schema: CourseSectionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseSectionRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{courseSectionId}',
  tags: ['Course Sections'],
  operationId: 'deleteCourseSection',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSectionPathParams,
  },
  responses: {
    204: {
      description: 'Course section deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
