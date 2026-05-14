import { createRoute, z } from '@hono/zod-openapi';
import { FileResourceId, SubmissionAttachment, SubmissionId } from '@openlms/contracts';
import { AssignmentSubmissionsPathParams } from './assignment-submissions.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const SubmissionAttachmentResponse = SubmissionAttachment.openapi('SubmissionAttachment');

export const CreateSubmissionAttachmentBody = z
  .object({
    fileResourceId: FileResourceId.openapi({
      description: 'Uploaded file resource to attach to the submission.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
    }),
    displayName: z.string().min(1).max(255).nullable().default(null).openapi({
      description: 'Optional attachment display name. Defaults to the file name.',
      example: 'evidence-appendix.pdf',
    }),
  })
  .strict();

export const SubmissionAttachmentsPathParams = AssignmentSubmissionsPathParams.extend({
  submissionId: SubmissionId.openapi({
    param: {
      name: 'submissionId',
      in: 'path',
      description: 'Submission identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE38',
  }),
});

export const listSubmissionAttachmentsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments',
  tags: ['Submissions'],
  operationId: 'listSubmissionAttachments',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionAttachmentsPathParams,
  },
  responses: {
    200: {
      description: 'Submission attachments visible to the authenticated user.',
      content: {
        'application/json': {
          schema: SubmissionAttachmentResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createSubmissionAttachmentRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/attachments',
  tags: ['Submissions'],
  operationId: 'createSubmissionAttachment',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionAttachmentsPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateSubmissionAttachmentBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created submission attachment.',
      content: {
        'application/json': {
          schema: SubmissionAttachmentResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
