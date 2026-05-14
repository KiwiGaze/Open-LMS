import { createRoute, z } from '@hono/zod-openapi';
import { SubmissionComment, SubmissionCommentVisibility, SubmissionId } from '@openlms/contracts';
import { AssignmentSubmissionsPathParams } from './assignment-submissions.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const SubmissionCommentResponse = SubmissionComment.openapi('SubmissionComment');
export const CreateSubmissionCommentBody = z
  .object({
    body: z.string().min(1).max(4000).openapi({
      description: 'Comment body to attach to the submission.',
      example: 'Please expand the evidence explanation.',
    }),
    visibility: SubmissionCommentVisibility.openapi({
      description:
        'Whether the comment is visible to the learner, only staff, or assigned peer reviewers.',
      example: 'student_visible',
    }),
  })
  .strict();

export const SubmissionCommentsPathParams = AssignmentSubmissionsPathParams.extend({
  submissionId: SubmissionId.openapi({
    param: {
      name: 'submissionId',
      in: 'path',
      description: 'Submission identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE38',
  }),
});

export const listSubmissionCommentsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments',
  tags: ['Submissions'],
  operationId: 'listSubmissionComments',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionCommentsPathParams,
  },
  responses: {
    200: {
      description: 'Submission comments visible to the authenticated user.',
      content: {
        'application/json': {
          schema: SubmissionCommentResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createSubmissionCommentRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/comments',
  tags: ['Submissions'],
  operationId: 'createSubmissionComment',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionCommentsPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateSubmissionCommentBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created submission comment.',
      content: {
        'application/json': {
          schema: SubmissionCommentResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
