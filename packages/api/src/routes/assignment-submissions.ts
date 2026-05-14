import { createRoute, z } from '@hono/zod-openapi';
import {
  AssignmentId,
  AssignmentSubmissionListItem,
  Draft,
  DraftBlock,
  DraftId,
  Submission,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const DraftResponse = Draft.openapi('Draft');
export const SubmissionResponse = Submission.openapi('Submission');
export const AssignmentSubmissionListItemResponse = AssignmentSubmissionListItem.openapi(
  'AssignmentSubmissionListItem',
  {
    description:
      'Assignment submission list item. studentId is null for staff views of anonymous-grading assignments.',
  },
);
export const SaveAssignmentDraftBody = z.object({
  blocks: DraftBlock.array().openapi({
    description: 'Structured draft content blocks to autosave or submit.',
  }),
});

export const AssignmentSubmissionsPathParams = CourseAssignmentPathParams.extend({
  assignmentId: AssignmentId.openapi({
    param: {
      name: 'assignmentId',
      in: 'path',
      description: 'Assignment identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE36',
  }),
});

export const AssignmentDraftPathParams = AssignmentSubmissionsPathParams.extend({
  draftId: DraftId.openapi({
    param: {
      name: 'draftId',
      in: 'path',
      description: 'Draft identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE37',
  }),
});

export const listAssignmentSubmissionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions',
  tags: ['Submissions'],
  operationId: 'listAssignmentSubmissions',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentSubmissionsPathParams,
  },
  responses: {
    200: {
      description: 'Assignment submissions visible to the authenticated user.',
      content: {
        'application/json': {
          schema: AssignmentSubmissionListItemResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const saveAssignmentDraftRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/drafts/{draftId}',
  tags: ['Submissions'],
  operationId: 'saveAssignmentDraft',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentDraftPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SaveAssignmentDraftBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Saved learner assignment draft.',
      content: {
        'application/json': {
          schema: DraftResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const submitAssignmentDraftRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/drafts/{draftId}/submit',
  tags: ['Submissions'],
  operationId: 'submitAssignmentDraft',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentDraftPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: SaveAssignmentDraftBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created assignment submission from the learner draft.',
      content: {
        'application/json': {
          schema: SubmissionResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
