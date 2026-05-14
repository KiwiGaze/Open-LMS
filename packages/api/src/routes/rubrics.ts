import { createRoute, z } from '@hono/zod-openapi';
import { Rubric, RubricCriterion, RubricId, RubricTemplateId } from '@openlms/contracts';
import { TenantPathParams } from './courses.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const RubricResponse = Rubric.openapi('Rubric');
const RubricCriterionInput = RubricCriterion.openapi('RubricCriterion');

export const CreateRubricBody = z
  .object({
    title: z.string().min(1).max(160).openapi({
      description: 'Rubric title.',
      example: 'Argument writing rubric',
    }),
    sourceTemplateId: RubricTemplateId.nullable().openapi({
      description: 'Optional template the rubric was authored from.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8D',
    }),
    criteria: RubricCriterionInput.array().min(1).openapi({
      description: 'Ordered list of rubric criteria. Must contain at least one entry.',
    }),
  })
  .strict();

export const createRubricRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/rubrics',
  tags: ['Rubrics'],
  operationId: 'createRubric',
  security: [{ bearerAuth: [] }],
  request: {
    params: TenantPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateRubricBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created rubric.',
      content: {
        'application/json': {
          schema: RubricResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const RubricPathParams = TenantPathParams.extend({
  rubricId: RubricId.openapi({
    param: {
      name: 'rubricId',
      in: 'path',
      description: 'Rubric identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE3C',
  }),
});

export const UpdateRubricBody = CreateRubricBody;

export const updateRubricRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/rubrics/{rubricId}',
  tags: ['Rubrics'],
  operationId: 'updateRubric',
  security: [{ bearerAuth: [] }],
  request: {
    params: RubricPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateRubricBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    200: {
      description: 'Updated rubric.',
      content: {
        'application/json': {
          schema: RubricResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteRubricRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/rubrics/{rubricId}',
  tags: ['Rubrics'],
  operationId: 'deleteRubric',
  security: [{ bearerAuth: [] }],
  request: {
    params: RubricPathParams,
  },
  responses: {
    204: {
      description: 'Rubric deleted.',
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
