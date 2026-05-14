import { z } from '@hono/zod-openapi';

export const UnauthorizedResponse = z.object({
  error: z.object({
    code: z.literal('unauthorized'),
    message: z.string(),
  }),
});

export const ForbiddenResponse = z.object({
  error: z.object({
    code: z.literal('forbidden'),
    message: z.string(),
  }),
});

export const BadRequestResponse = z.object({
  error: z.object({
    code: z.literal('bad_request'),
    message: z.string(),
  }),
});

export const NotFoundResponse = z.object({
  error: z.object({
    code: z.literal('not_found'),
    message: z.string(),
  }),
});

export const ConflictResponse = z.object({
  error: z.object({
    code: z.literal('conflict'),
    message: z.string(),
  }),
});

export const unauthorizedResponse = {
  description: 'Authentication is required.',
  content: {
    'application/json': {
      schema: UnauthorizedResponse,
    },
  },
};

export const badRequestResponse = {
  description: 'The request path, query, or body is invalid.',
  content: {
    'application/json': {
      schema: BadRequestResponse,
    },
  },
};

export const notFoundResponse = {
  description: 'The requested resource was not found.',
  content: {
    'application/json': {
      schema: NotFoundResponse,
    },
  },
};

export const forbiddenResponse = {
  description: 'The authenticated user is not allowed to access this resource.',
  content: {
    'application/json': {
      schema: ForbiddenResponse,
    },
  },
};

export const conflictResponse = {
  description: 'The request conflicts with current resource state (e.g. duplicate key).',
  content: {
    'application/json': {
      schema: ConflictResponse,
    },
  },
};
