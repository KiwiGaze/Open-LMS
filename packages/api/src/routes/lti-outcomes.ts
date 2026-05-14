import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseExternalToolId,
  CourseExternalToolOutcome,
  CourseExternalToolOutcomeStatus,
  UserId,
} from '@openlms/contracts';
import { AssignmentPathParams } from './assignments.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const CourseExternalToolOutcomeResponse = CourseExternalToolOutcome.openapi(
  'CourseExternalToolOutcome',
);

export const RecordCourseExternalToolOutcomeBody = z
  .object({
    studentId: UserId.openapi({
      description: 'Learner the outcome belongs to.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3X',
    }),
    externalToolId: CourseExternalToolId.openapi({
      description: 'External tool that produced the outcome.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3Y',
    }),
    score: z.number().nonnegative().finite().openapi({
      description: 'Score reported by the external tool.',
      example: 85,
    }),
    maxScore: z.number().positive().finite().openapi({
      description: 'Maximum possible score for the outcome.',
      example: 100,
    }),
    status: CourseExternalToolOutcomeStatus.openapi({
      description: 'Workflow status of the outcome.',
      example: 'published',
    }),
    reportedAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'When the external tool reported the outcome (ISO 8601).',
        example: '2026-05-12T14:00:00.000Z',
      }),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.score > value.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'score cannot exceed maxScore.',
        path: ['score'],
      });
    }
  });

export const recordCourseExternalToolOutcomeRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/lti-outcomes',
  tags: ['Assignments'],
  operationId: 'recordCourseExternalToolOutcome',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RecordCourseExternalToolOutcomeBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'LTI outcome recorded (upserted by tool/student/assignment tuple).',
      content: {
        'application/json': {
          schema: CourseExternalToolOutcomeResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCourseExternalToolOutcomesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/lti-outcomes',
  tags: ['Assignments'],
  operationId: 'listCourseExternalToolOutcomes',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentPathParams,
  },
  responses: {
    200: {
      description: 'LTI outcomes recorded against this assignment.',
      content: {
        'application/json': {
          schema: CourseExternalToolOutcomeResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
