import { createRoute, z } from '@hono/zod-openapi';
import { GlossaryEntry, GlossaryEntryId, GlossaryEntryStatus } from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const GlossaryEntryResponse = GlossaryEntry.openapi('GlossaryEntry');

export const listGlossaryEntriesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/glossary',
  tags: ['Glossary'],
  operationId: 'listGlossaryEntries',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Glossary entries visible to the authenticated user.',
      content: {
        'application/json': {
          schema: GlossaryEntryResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateGlossaryEntryBody = z
  .object({
    term: z.string().min(1).max(160).openapi({
      description: 'Term, headword, or concept. Unique per course.',
      example: 'thesis',
    }),
    definition: z.string().min(1).max(4_000).openapi({
      description: 'Definition of the term.',
      example: 'A central claim supported by evidence and reasoning.',
    }),
    status: GlossaryEntryStatus.openapi({
      description: 'Lifecycle status for the entry.',
      example: 'published',
    }),
  })
  .strict();

export const createGlossaryEntryRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/glossary',
  tags: ['Glossary'],
  operationId: 'createGlossaryEntry',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateGlossaryEntryBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created glossary entry.',
      content: {
        'application/json': {
          schema: GlossaryEntryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const CourseGlossaryEntryPathParams = CourseAssignmentPathParams.extend({
  glossaryEntryId: GlossaryEntryId.openapi({
    param: {
      name: 'glossaryEntryId',
      in: 'path',
      description: 'Glossary entry identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE8C',
  }),
});

export const UpdateGlossaryEntryBody = z
  .object({
    term: z.string().min(1).max(160).openapi({
      description: 'Term, headword, or concept.',
      example: 'thesis',
    }),
    definition: z.string().min(1).max(4_000).openapi({
      description: 'Updated definition.',
      example: 'A central claim supported by evidence and reasoning.',
    }),
    status: GlossaryEntryStatus.openapi({
      description: 'Lifecycle status for the entry.',
      example: 'published',
    }),
  })
  .strict();

export const updateGlossaryEntryRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/glossary/{glossaryEntryId}',
  tags: ['Glossary'],
  operationId: 'updateGlossaryEntry',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGlossaryEntryPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateGlossaryEntryBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated glossary entry.',
      content: {
        'application/json': {
          schema: GlossaryEntryResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse,
  },
});

export const deleteGlossaryEntryRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/glossary/{glossaryEntryId}',
  tags: ['Glossary'],
  operationId: 'deleteGlossaryEntry',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseGlossaryEntryPathParams,
  },
  responses: {
    204: {
      description: 'Glossary entry deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
