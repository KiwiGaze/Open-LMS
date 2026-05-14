import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseId,
  CourseSectionId,
  CourseSectionInstructor,
  CourseSectionMember,
  TenantId,
  UserId,
} from '@openlms/contracts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CourseSectionMemberResponse = CourseSectionMember.openapi('CourseSectionMember');
export const CourseSectionInstructorResponse =
  CourseSectionInstructor.openapi('CourseSectionInstructor');

export const CourseSectionPathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
  courseId: CourseId.openapi({
    param: { name: 'courseId', in: 'path', description: 'Course identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0B',
  }),
  sectionId: CourseSectionId.openapi({
    param: { name: 'sectionId', in: 'path', description: 'Section identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0C',
  }),
});

export const SectionMemberStudentPathParams = CourseSectionPathParams.extend({
  studentId: UserId.openapi({
    param: { name: 'studentId', in: 'path', description: 'Student identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0D',
  }),
});

export const SectionInstructorPathParams = CourseSectionPathParams.extend({
  instructorId: UserId.openapi({
    param: { name: 'instructorId', in: 'path', description: 'Instructor identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0E',
  }),
});

export const AssignSectionMemberBody = z
  .object({
    studentId: UserId,
  })
  .strict();

export const AssignSectionInstructorBody = z
  .object({
    instructorId: UserId,
  })
  .strict();

export const listSectionMembersRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/members',
  tags: ['Course Memberships'],
  operationId: 'listSectionMembers',
  security: [{ bearerAuth: [] }],
  request: { params: CourseSectionPathParams },
  responses: {
    200: {
      description: 'Students assigned to the section. Staff-only.',
      content: { 'application/json': { schema: CourseSectionMemberResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const assignSectionMemberRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/members',
  tags: ['Course Memberships'],
  operationId: 'assignSectionMember',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSectionPathParams,
    body: { required: true, content: { 'application/json': { schema: AssignSectionMemberBody } } },
  },
  responses: {
    201: {
      description: 'Student assigned to the section.',
      content: { 'application/json': { schema: CourseSectionMemberResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const removeSectionMemberRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/members/{studentId}',
  tags: ['Course Memberships'],
  operationId: 'removeSectionMember',
  security: [{ bearerAuth: [] }],
  request: { params: SectionMemberStudentPathParams },
  responses: {
    204: { description: 'Student removed from the section.' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listSectionInstructorsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors',
  tags: ['Course Memberships'],
  operationId: 'listSectionInstructors',
  security: [{ bearerAuth: [] }],
  request: { params: CourseSectionPathParams },
  responses: {
    200: {
      description: 'Instructors assigned to the section. Staff-only.',
      content: { 'application/json': { schema: CourseSectionInstructorResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const assignSectionInstructorRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors',
  tags: ['Course Memberships'],
  operationId: 'assignSectionInstructor',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseSectionPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: AssignSectionInstructorBody } },
    },
  },
  responses: {
    201: {
      description: 'Instructor assigned to the section.',
      content: { 'application/json': { schema: CourseSectionInstructorResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const removeSectionInstructorRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/sections/{sectionId}/instructors/{instructorId}',
  tags: ['Course Memberships'],
  operationId: 'removeSectionInstructor',
  security: [{ bearerAuth: [] }],
  request: { params: SectionInstructorPathParams },
  responses: {
    204: { description: 'Instructor removed from the section.' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
