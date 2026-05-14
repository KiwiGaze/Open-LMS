import { createRoute, z } from '@hono/zod-openapi';
import {
  AssignmentPeerReview,
  AssignmentPeerReviewId,
  AssignmentPeerReviewResponse,
  AssignmentPeerReviewResponseStatus,
} from '@openlms/contracts';
import { AssignmentSubmissionsPathParams } from './assignment-submissions.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const AssignmentPeerReviewResponseSchema =
  AssignmentPeerReview.openapi('AssignmentPeerReview');
export const AssignmentPeerReviewResponseRecordSchema = AssignmentPeerReviewResponse.openapi(
  'AssignmentPeerReviewResponse',
);

export const listAssignmentPeerReviewsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews',
  tags: ['Submissions'],
  operationId: 'listAssignmentPeerReviews',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentSubmissionsPathParams,
  },
  responses: {
    200: {
      description: 'Assignment peer reviews visible to the authenticated user.',
      content: {
        'application/json': {
          schema: AssignmentPeerReviewResponseSchema.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const PeerReviewPathParams = AssignmentSubmissionsPathParams.extend({
  peerReviewId: AssignmentPeerReviewId.openapi({
    param: { name: 'peerReviewId', in: 'path', description: 'Peer review identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0D',
  }),
});

export const PeerReviewCriterionPathParams = PeerReviewPathParams.extend({
  criterionId: z
    .string()
    .min(1)
    .max(64)
    .openapi({
      param: { name: 'criterionId', in: 'path', description: 'Rubric criterion identifier.' },
      example: 'evidence',
    }),
});

export const UpsertPeerReviewResponseBody = z
  .object({
    score: z.number().finite().nonnegative().nullable(),
    comment: z.string().min(1).max(4_000).nullable(),
    status: AssignmentPeerReviewResponseStatus,
  })
  .strict();

export const listPeerReviewResponsesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews/{peerReviewId}/responses',
  tags: ['Submissions'],
  operationId: 'listPeerReviewResponses',
  security: [{ bearerAuth: [] }],
  request: { params: PeerReviewPathParams },
  responses: {
    200: {
      description: 'Peer review responses for the given review.',
      content: {
        'application/json': { schema: AssignmentPeerReviewResponseRecordSchema.array() },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertPeerReviewResponseRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/peer-reviews/{peerReviewId}/responses/{criterionId}',
  tags: ['Submissions'],
  operationId: 'upsertPeerReviewResponse',
  security: [{ bearerAuth: [] }],
  request: {
    params: PeerReviewCriterionPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: UpsertPeerReviewResponseBody } },
    },
  },
  responses: {
    200: {
      description: 'Peer review response stored.',
      content: { 'application/json': { schema: AssignmentPeerReviewResponseRecordSchema } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
