import { createRoute, z } from '@hono/zod-openapi';
import {
  IntegrationConnectionId,
  SubmissionId,
  SubmissionPlagiarismReport,
  SubmissionPlagiarismReportStatus,
  TenantId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const SubmissionPlagiarismReportResponse = SubmissionPlagiarismReport.openapi(
  'SubmissionPlagiarismReport',
);

export const SubmissionPlagiarismReportPathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  }),
  submissionId: SubmissionId.openapi({
    param: { name: 'submissionId', in: 'path', description: 'Submission identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3W',
  }),
});

export const RecordSubmissionPlagiarismReportBody = z
  .object({
    integrationConnectionId: IntegrationConnectionId.openapi({
      description: 'Integration connection that produced the similarity report.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE3V',
    }),
    similarityPercent: z.number().min(0).max(100).finite().openapi({
      description: 'Similarity percentage reported by the provider (0..100).',
      example: 12.5,
    }),
    reportUrl: z
      .string()
      .regex(/^https:\/\//, { message: 'reportUrl must use HTTPS.' })
      .url()
      .max(2048)
      .nullable()
      .openapi({
        description: 'Optional HTTPS link to the full provider report.',
        example: 'https://provider.example/report/abc',
      }),
    status: SubmissionPlagiarismReportStatus.openapi({
      description: 'Workflow status of the report.',
      example: 'complete',
    }),
    checkedAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .openapi({
        description: 'When the provider produced the report (ISO 8601).',
        example: '2026-05-12T15:30:00.000Z',
      }),
  })
  .strict();

export const recordSubmissionPlagiarismReportRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/submissions/{submissionId}/plagiarism-reports',
  tags: ['Submissions'],
  operationId: 'recordSubmissionPlagiarismReport',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionPlagiarismReportPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RecordSubmissionPlagiarismReportBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Plagiarism report recorded (upserted by provider).',
      content: {
        'application/json': {
          schema: SubmissionPlagiarismReportResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listSubmissionPlagiarismReportsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/submissions/{submissionId}/plagiarism-reports',
  tags: ['Submissions'],
  operationId: 'listSubmissionPlagiarismReports',
  security: [{ bearerAuth: [] }],
  request: {
    params: SubmissionPlagiarismReportPathParams,
  },
  responses: {
    200: {
      description: 'Plagiarism reports recorded for this submission.',
      content: {
        'application/json': {
          schema: SubmissionPlagiarismReportResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listCoursePlagiarismReportsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/plagiarism-reports/latest',
  tags: ['Submissions'],
  operationId: 'listCoursePlagiarismReports',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description:
        'Latest plagiarism report per submission for this course, used by the gradebook similarity column. Staff-only.',
      content: {
        'application/json': {
          schema: SubmissionPlagiarismReportResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
