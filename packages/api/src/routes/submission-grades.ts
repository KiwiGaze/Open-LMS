import { createRoute, z } from '@hono/zod-openapi';
import { Grade, GradeStatus, SubmissionId } from '@openlms/contracts';
import { AssignmentSubmissionsPathParams } from './assignment-submissions.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const GradeResponse = Grade.openapi('Grade');

export const SubmissionGradePathParams = AssignmentSubmissionsPathParams.extend({
  submissionId: SubmissionId.openapi({
    param: {
      name: 'submissionId',
      in: 'path',
      description: 'Submission identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE38',
  }),
});

export const UpsertSubmissionGradeBody = z
  .object({
    score: z.number().nonnegative().openapi({
      description: 'Score awarded to the submission. Must not exceed maxScore.',
      example: 8.5,
    }),
    maxScore: z.number().positive().openapi({
      description: 'Maximum possible score for this grade.',
      example: 10,
    }),
    status: GradeStatus.openapi({
      description:
        'Lifecycle status for the grade. Use "draft" while iterating and "published" to release.',
      example: 'published',
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

export const upsertSubmissionGradeRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade',
  tags: ['Submissions'],
  operationId: 'upsertSubmissionGrade',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionGradePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpsertSubmissionGradeBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Grade saved (created or updated). Staff-only.',
      content: {
        'application/json': {
          schema: GradeResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const BatchSubmissionGradeItem = z
  .object({
    submissionId: SubmissionId.openapi({
      description: 'Submission to grade.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE38',
    }),
    score: z.number().nonnegative().openapi({
      description: 'Score awarded to the submission. Must not exceed maxScore.',
      example: 8.5,
    }),
    maxScore: z.number().positive().openapi({
      description: 'Maximum possible score for this grade.',
      example: 10,
    }),
    status: GradeStatus.openapi({
      description: 'Lifecycle status for the grade.',
      example: 'draft',
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

export const BatchUpsertSubmissionGradesBody = z
  .object({
    grades: z.array(BatchSubmissionGradeItem).min(1).max(200),
  })
  .strict();

export const BatchSubmissionGradeResult = z
  .object({
    submissionId: SubmissionId,
    status: z.enum(['saved', 'failed']),
    grade: Grade.nullable(),
    error: z.string().nullable(),
  })
  .strict()
  .openapi('BatchSubmissionGradeResult');

export const BatchUpsertSubmissionGradesResponse = z
  .object({
    results: z.array(BatchSubmissionGradeResult),
    savedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
  })
  .strict()
  .openapi('BatchUpsertSubmissionGradesResponse');

export const batchUpsertSubmissionGradesRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/grades/batch',
  tags: ['Submissions'],
  operationId: 'batchUpsertSubmissionGrades',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentSubmissionsPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: BatchUpsertSubmissionGradesBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Per-item outcome of the batch grade upsert. Failures are surfaced per item.',
      content: {
        'application/json': {
          schema: BatchUpsertSubmissionGradesResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const importSubmissionGradesCsvRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/assignments/{assignmentId}/grades/import-csv',
  tags: ['Submissions'],
  operationId: 'importSubmissionGradesCsv',
  security: [{ bearerAuth: [] }],
  request: {
    params: AssignmentSubmissionsPathParams,
    body: {
      required: true,
      content: {
        'text/csv': {
          schema: z.string().min(1),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Per-row outcome of the assignment grade CSV import.',
      content: {
        'application/json': {
          schema: BatchUpsertSubmissionGradesResponse,
        },
      },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
