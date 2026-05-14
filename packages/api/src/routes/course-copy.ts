import { createRoute, z } from '@hono/zod-openapi';
import { CourseId } from '@openlms/contracts';
import { CoursePathParams } from './courses.ts';
import { badRequestResponse, forbiddenResponse, unauthorizedResponse } from './responses.ts';

export const CopyCourseBody = z
	.object({
		targetCourseId: CourseId.openapi({
			description: 'Target course to receive copied course content.',
			example: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
		}),
	})
  .strict();

export const CopyCourseResponse = z
  .object({
    learningObjectivesCopied: z.number().int().nonnegative().openapi({
      description: 'Number of learning objectives copied into the target course.',
      example: 5,
    }),
    modulesCopied: z.number().int().nonnegative().openapi({
      description: 'Number of modules copied into the target course.',
      example: 4,
    }),
    unitsCopied: z.number().int().nonnegative().openapi({
      description: 'Number of course units copied into the target course.',
      example: 8,
    }),
    pagesCopied: z.number().int().nonnegative().openapi({
      description: 'Number of course pages copied into the target course.',
      example: 3,
    }),
    resourcesCopied: z.number().int().nonnegative().openapi({
      description: 'Number of course resources copied into the target course.',
      example: 12,
    }),
    wikiPagesCopied: z.number().int().nonnegative().openapi({
      description: 'Number of wiki pages copied into the target course.',
      example: 3,
    }),
    glossaryEntriesCopied: z.number().int().nonnegative().openapi({
      description: 'Number of glossary entries copied into the target course.',
      example: 6,
    }),
  })
  .strict()
  .openapi('CopyCourseResult');

export const copyCourseRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/copy',
  tags: ['Courses'],
  operationId: 'copyCourse',
  security: [{ bearerAuth: [] }],
  request: {
    params: CoursePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CopyCourseBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Course content copied successfully.',
      content: {
        'application/json': {
          schema: CopyCourseResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
