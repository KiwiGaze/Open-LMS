import { createRoute, z } from '@hono/zod-openapi';
import {
  CompletionProgress,
  CompletionRequirement,
  CompletionRequirementId,
  CompletionRequirementStatus,
  CompletionRequirementType,
  CompletionTargetType,
  CourseModuleId,
} from '@openlms/contracts';
import { CourseAssignmentPathParams } from './assignments.ts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const CompletionRequirementResponse = CompletionRequirement.openapi('CompletionRequirement');
export const CompletionProgressResponse = CompletionProgress.openapi('CompletionProgress');

export const CompletionRequirementsQuery = z.object({
  moduleId: CourseModuleId.optional().openapi({
    description: 'Optional module filter for module-scoped completion requirements.',
    example: '01J9QW7B6N5W2YH3D3A1V0KE31',
  }),
});

const refineCompletionRequirement = <
  T extends {
    requirementType: CompletionRequirementType;
    targetType: CompletionTargetType;
    targetId: string | null;
    minScorePercent: number | null;
  },
>(
  requirement: T,
  context: z.RefinementCtx,
): void => {
  if (requirement.requirementType === 'manual') {
    if (requirement.targetType !== 'manual') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual completion requirements must use the manual target type.',
        path: ['targetType'],
      });
    }

    if (requirement.targetId !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual completion requirements cannot target a resource.',
        path: ['targetId'],
      });
    }
  }

  if (requirement.requirementType === 'pass_quiz') {
    if (requirement.targetType !== 'quiz') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pass quiz completion requirements must target a quiz.',
        path: ['targetType'],
      });
    }

    if (requirement.targetId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pass quiz completion requirements must include a quiz target.',
        path: ['targetId'],
      });
    }
  } else if (requirement.minScorePercent !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum score thresholds are only valid for pass quiz requirements.',
      path: ['minScorePercent'],
    });
  }
};

export const CourseCompletionRequirementPathParams = CourseAssignmentPathParams.extend({
  requirementId: CompletionRequirementId.openapi({
    param: {
      name: 'requirementId',
      in: 'path',
      description: 'Completion requirement identifier.',
    },
    example: '01J9QW7B6N5W2YH3D3A1V0KE4J',
  }),
});

export const listCompletionRequirementsRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements',
  tags: ['Completion'],
  operationId: 'listCompletionRequirements',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    query: CompletionRequirementsQuery,
  },
  responses: {
    200: {
      description: 'Completion requirements visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CompletionRequirementResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const CreateCompletionRequirementBody = z
  .object({
    title: z.string().min(1).max(180).openapi({
      description: 'Completion requirement title.',
      example: 'Submit Essay 1',
    }),
    description: z.string().min(1).max(4_000).nullable().openapi({
      description: 'Optional learner-facing description.',
      example: 'Submit the evidence-based essay before the unit progresses.',
    }),
    moduleId: CourseModuleId.nullable().openapi({
      description: 'Optional module scope for this completion requirement.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE31',
    }),
    requirementType: CompletionRequirementType.openapi({
      description: 'Activity that satisfies the requirement.',
      example: 'submit_assignment',
    }),
    targetType: CompletionTargetType.openapi({
      description: 'Type of resource the requirement targets.',
      example: 'assignment',
    }),
    targetId: z.string().min(1).max(128).nullable().openapi({
      description: 'Identifier of the targeted resource. Null for manual requirements.',
      example: '01J9QW7B6N5W2YH3D3A1V0KE8K',
    }),
    minScorePercent: z.number().min(0).max(100).nullable().openapi({
      description: 'Optional minimum score percent for pass_quiz requirements.',
      example: 70,
    }),
    status: CompletionRequirementStatus.openapi({
      description: 'Lifecycle status for the requirement.',
      example: 'active',
    }),
    required: z.boolean().openapi({
      description: 'Whether the requirement must be satisfied for completion.',
      example: true,
    }),
    position: z.number().int().nonnegative().openapi({
      description: 'Sort position within the course completion checklist.',
      example: 0,
    }),
  })
  .strict()
  .superRefine(refineCompletionRequirement);

export const createCompletionRequirementRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements',
  tags: ['Completion'],
  operationId: 'createCompletionRequirement',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseAssignmentPathParams,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateCompletionRequirementBody,
        },
      },
    },
  },
  responses: {
    400: badRequestResponse,
    201: {
      description: 'Created completion requirement.',
      content: {
        'application/json': {
          schema: CompletionRequirementResponse,
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const listCompletionProgressRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/completion-requirements/{requirementId}/progress',
  tags: ['Completion'],
  operationId: 'listCompletionProgress',
  security: [{ bearerAuth: [] }],
  request: {
    params: CourseCompletionRequirementPathParams,
  },
  responses: {
    200: {
      description: 'Completion progress visible to the authenticated user.',
      content: {
        'application/json': {
          schema: CompletionProgressResponse.array(),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
