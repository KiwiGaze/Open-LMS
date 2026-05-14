import { createRoute, z } from '@hono/zod-openapi';
import { CourseAnnouncement, CourseAnnouncementId } from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseAnnouncementResponse = CourseAnnouncement.openapi('CourseAnnouncement');
export const CreateCourseAnnouncementBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Announcement title.',
      example: 'Essay workshop reminder',
    }),
    body: z.string().min(1).openapi({
      description: 'Announcement body visible to course members.',
      example: 'Bring one paragraph and one question for peer review.',
    }),
    status: z.enum(['draft', 'published']).openapi({
      description: 'Whether the announcement is saved as a draft or immediately published.',
      example: 'published',
    }),
    pinned: z.boolean().openapi({
      description: 'Whether the announcement should stay pinned to the top of the list.',
      example: true,
    }),
  })
  .strict();

export const listCourseAnnouncementsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements',
  tags: ['Announcements'],
  operationId: 'listCourseAnnouncements',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Course announcements visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CourseAnnouncementResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const createCourseAnnouncementsRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements',
  tags: ['Announcements'],
  operationId: 'createCourseAnnouncement',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCourseAnnouncementBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created course announcement.',
      content: {
        'application/json': {
          schema: CourseAnnouncementResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CourseAnnouncementPathParams = CourseAssignmentPathParams.extend({
  announcementId: CourseAnnouncementId.openapi({
    param: {
      name: 'announcementId',
      in: 'path',
      description: 'Course announcement identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE87',
  }),
});

export const UpdateCourseAnnouncementBody = CreateCourseAnnouncementBody;

export const updateCourseAnnouncementRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements/{announcementId}',
  tags: ['Announcements'],
  operationId: 'updateCourseAnnouncement',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAnnouncementPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateCourseAnnouncementBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated course announcement.',
      content: {
        'application/json': {
          schema: CourseAnnouncementResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteCourseAnnouncementRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/announcements/{announcementId}',
  tags: ['Announcements'],
  operationId: 'deleteCourseAnnouncement',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAnnouncementPathParams,
  },
  responses: {
    204: {
      description: 'Course announcement deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
