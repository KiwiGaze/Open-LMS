import { createRoute, z } from '@hono/zod-openapi';
import {
  LearningObjectiveId,
  WikiPage,
  WikiPageId,
  WikiPageRevision,
  WikiPageRevisionDiff,
  WikiPageStatus,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  conflictResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const WikiPageResponse = WikiPage.openapi('WikiPage');
export const WikiPageRevisionResponse = WikiPageRevision.openapi('WikiPageRevision');
export const WikiPageRevisionDiffResponse =
  WikiPageRevisionDiff.openapi('WikiPageRevisionDiff');

export const CourseWikiPagePathParams = CourseAssignmentPathParams.extend({
  wikiPageId: WikiPageId.openapi({
    param: {
      name: 'wikiPageId',
      in: 'path',
      description: 'Wiki page identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE90',
  }),
});

const WikiRevisionNumberParam = (name: string, description: string) =>
  z.coerce.number().int().positive().openapi({
    param: {
      name,
      in: 'path',
      description,
    },
    example: 2,
  });

export const CourseWikiPageRevisionDiffPathParams = CourseWikiPagePathParams.extend({
  baseRevision: WikiRevisionNumberParam('baseRevision', 'Base wiki revision number.'),
  targetRevision: WikiRevisionNumberParam('targetRevision', 'Target wiki revision number.'),
});

export const CourseWikiPageRevisionRestorePathParams = CourseWikiPagePathParams.extend({
  revision: WikiRevisionNumberParam('revision', 'Wiki revision number to restore.'),
});

export const listWikiPagesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages',
  tags: ['Wiki'],
  operationId: 'listWikiPages',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
  },
  responses: {
    200: {
      description: 'Wiki pages visible to the authenticated user.',
      content: {
        'application/json': {
          schema: WikiPageResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateWikiPageBody = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9][a-z0-9-]*$/)
      .openapi({
        description: 'URL-friendly slug for the wiki page. Unique per course.',
        example: 'arguing-from-evidence',
      }),
    title: z.string().min(1).max(180).openapi({
      description: 'Wiki page title displayed in the table of contents.',
      example: 'Arguing from evidence',
    }),
    content: z.string().min(1).max(50_000).openapi({
      description: 'Wiki page content (Markdown allowed).',
      example: 'A starting outline for class collaboration.',
    }),
    status: WikiPageStatus.openapi({
      description: 'Lifecycle status for the wiki page.',
      example: 'published',
    }),
    learningObjectiveIds: z
      .array(LearningObjectiveId)
      .default([])
      .openapi({
        description: 'Learning objectives this wiki page supports.',
        example: ['01J9QW7B6N5W2YH3D3A1V0KE91'],
      }),
  })
  .strict();

export const createWikiPageRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages',
  tags: ['Wiki'],
  operationId: 'createWikiPage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateWikiPageBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created wiki page.',
      content: {
        'application/json': {
          schema: WikiPageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: conflictResponse,
  },
});

export const UpdateWikiPageBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Wiki page title.',
      example: 'Arguing from evidence v2',
    }),
    content: z.string().min(1).max(50_000).openapi({
      description: 'Updated wiki page content.',
      example: 'Refreshed outline after class discussion.',
    }),
    status: WikiPageStatus.openapi({
      description: 'Lifecycle status for the wiki page.',
      example: 'published',
    }),
    learningObjectiveIds: z
      .array(LearningObjectiveId)
      .default([])
      .openapi({
        description: 'Learning objectives this wiki page supports.',
        example: ['01J9QW7B6N5W2YH3D3A1V0KE91'],
      }),
    summary: z.string().min(1).max(500).nullable().openapi({
      description: 'Optional change summary recorded with the revision.',
      example: 'Tightened thesis section and added a new example.',
    }),
  })
  .strict();

export const updateWikiPageRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}',
  tags: ['Wiki'],
  operationId: 'updateWikiPage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseWikiPagePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateWikiPageBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated wiki page.',
      content: {
        'application/json': {
          schema: WikiPageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listWikiPageRevisionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}/revisions',
  tags: ['Wiki'],
  operationId: 'listWikiPageRevisions',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseWikiPagePathParams,
  },
  responses: {
    200: {
      description: 'Wiki page revisions in newest-first order.',
      content: {
        'application/json': {
          schema: WikiPageRevisionResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const diffWikiPageRevisionsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}/revisions/{baseRevision}/diff/{targetRevision}',
  tags: ['Wiki'],
  operationId: 'diffWikiPageRevisions',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseWikiPageRevisionDiffPathParams,
  },
  responses: {
    200: {
      description: 'Line-oriented diff between two wiki page revisions.',
      content: {
        'application/json': {
          schema: WikiPageRevisionDiffResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const RestoreWikiPageRevisionBody = z
  .object({
    summary: z.string().min(1).max(500).nullable().default(null).openapi({
      description: 'Optional change summary recorded on the restore revision.',
      example: 'Restored revision 2 after instructor review.',
    }),
  })
  .strict();

export const restoreWikiPageRevisionRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}/revisions/{revision}/restore',
  tags: ['Wiki'],
  operationId: 'restoreWikiPageRevision',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseWikiPageRevisionRestorePathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RestoreWikiPageRevisionBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Wiki page restored from the selected revision.',
      content: {
        'application/json': {
          schema: WikiPageResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteWikiPageRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/wiki-pages/{wikiPageId}',
  tags: ['Wiki'],
  operationId: 'deleteWikiPage',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseWikiPagePathParams,
  },
  responses: {
    204: {
      description: 'Wiki page deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
