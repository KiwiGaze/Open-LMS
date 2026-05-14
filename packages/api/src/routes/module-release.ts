import { createRoute, z } from '@hono/zod-openapi';
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseRuleId,
  ModuleReleaseCombinator,
  ModuleReleaseDateAfterConfig,
  ModuleReleaseDecision,
  ModuleReleaseManualUnlockConfig,
  ModuleReleaseObjectiveMasteryConfig,
  ModuleReleaseOverride,
  ModuleReleaseOverrideState,
  ModuleReleasePolicy,
  ModuleReleasePrerequisiteModulesConfig,
  ModuleReleaseRule,
  ModuleReleaseRuleStatus,
  ModuleReleaseTargetType,
  TenantId,
  UserId,
} from '@openlms/contracts';
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from './responses.ts';

export const ModuleReleaseRuleResponse = ModuleReleaseRule.openapi('ModuleReleaseRule');
export const ModuleReleasePolicyResponse = ModuleReleasePolicy.openapi('ModuleReleasePolicy');
export const ModuleReleaseOverrideResponse = ModuleReleaseOverride.openapi('ModuleReleaseOverride');
export const ModuleReleaseDecisionResponse = ModuleReleaseDecision.openapi('ModuleReleaseDecision');

export const ModuleReleaseModulePathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
  courseId: CourseId.openapi({
    param: { name: 'courseId', in: 'path', description: 'Course identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0B',
  }),
  moduleId: CourseModuleId.openapi({
    param: { name: 'moduleId', in: 'path', description: 'Course module identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0C',
  }),
});

export const ModuleReleaseRulePathParams = ModuleReleaseModulePathParams.extend({
  ruleId: CourseModuleReleaseRuleId.openapi({
    param: { name: 'ruleId', in: 'path', description: 'Release rule identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0D',
  }),
});

export const ModuleReleaseOverrideStudentPathParams = ModuleReleaseModulePathParams.extend({
  studentId: UserId.openapi({
    param: { name: 'studentId', in: 'path', description: 'Student identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0E',
  }),
});

export const ModuleReleaseCoursePathParams = z.object({
  tenantId: TenantId.openapi({
    param: { name: 'tenantId', in: 'path', description: 'Tenant identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0A',
  }),
  courseId: CourseId.openapi({
    param: { name: 'courseId', in: 'path', description: 'Course identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0B',
  }),
});

export const ModuleReleaseStudentCoursePathParams = ModuleReleaseCoursePathParams.extend({
  studentId: UserId.openapi({
    param: { name: 'studentId', in: 'path', description: 'Student identifier.' },
    example: '01J9QW7B6N5W2YH3D3A1V0KE0E',
  }),
});

export const ModuleReleaseRulesQuery = z
  .object({
    targetType: ModuleReleaseTargetType.optional().openapi({
      param: {
        name: 'targetType',
        in: 'query',
        description: 'Optional release target type filter.',
      },
    }),
    targetId: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .openapi({
        param: {
          name: 'targetId',
          in: 'query',
          description: 'Optional item target id filter for item-scoped rules.',
        },
      }),
  })
  .strict();

const ReleaseRuleConfigUnion = z.discriminatedUnion('ruleType', [
  z.object({
    ruleType: z.literal('prerequisite_modules'),
    config: ModuleReleasePrerequisiteModulesConfig,
  }),
  z.object({
    ruleType: z.literal('objective_mastery'),
    config: ModuleReleaseObjectiveMasteryConfig,
  }),
  z.object({ ruleType: z.literal('date_after'), config: ModuleReleaseDateAfterConfig }),
  z.object({ ruleType: z.literal('manual_unlock'), config: ModuleReleaseManualUnlockConfig }),
]);

const ReleaseRuleEnvelope = z
  .object({
    targetType: ModuleReleaseTargetType.default('module').openapi({
      description: 'Release target scope. Module rules use targetId null.',
    }),
    targetId: z.string().min(1).max(128).nullable().default(null).openapi({
      description: 'Item target id for item-scoped rules, or null for module rules.',
    }),
    position: z.number().int().nonnegative(),
    status: ModuleReleaseRuleStatus,
  })
  .and(ReleaseRuleConfigUnion)
  .superRefine((value, context) => {
    if (value.targetType === 'module' && value.targetId !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Module-scoped release rules cannot include an item target.',
        path: ['targetId'],
      });
    }

    if (value.targetType !== 'module' && value.targetId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Item-scoped release rules must include a target id.',
        path: ['targetId'],
      });
    }
  });

export const CreateReleaseRuleBody = ReleaseRuleEnvelope.openapi({
  description: 'Create a release rule for the module.',
});

export const UpdateReleaseRuleBody = ReleaseRuleEnvelope.openapi({
  description: 'Replace the release rule.',
});

export const UpsertReleasePolicyBody = z
  .object({ combinator: ModuleReleaseCombinator })
  .strict()
  .openapi({ description: 'Set the combinator for module release rules.' });

export const UpsertReleaseOverrideBody = z
  .object({
    state: ModuleReleaseOverrideState,
    reason: z.string().min(1).max(2_000).nullable(),
    expiresAt: z.coerce.date().nullable(),
  })
  .strict()
  .openapi({ description: 'Pin a per-student release state.' });

export const listModuleReleaseRulesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules',
  tags: ['ModuleRelease'],
  operationId: 'listModuleReleaseRules',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseModulePathParams, query: ModuleReleaseRulesQuery },
  responses: {
    200: {
      description: 'Release rules for the module.',
      content: { 'application/json': { schema: ModuleReleaseRuleResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const createModuleReleaseRuleRoute = createRoute({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules',
  tags: ['ModuleRelease'],
  operationId: 'createModuleReleaseRule',
  security: [{ bearerAuth: [] }],
  request: {
    params: ModuleReleaseModulePathParams,
    body: { required: true, content: { 'application/json': { schema: CreateReleaseRuleBody } } },
  },
  responses: {
    201: {
      description: 'Created release rule.',
      content: { 'application/json': { schema: ModuleReleaseRuleResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const updateModuleReleaseRuleRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules/{ruleId}',
  tags: ['ModuleRelease'],
  operationId: 'updateModuleReleaseRule',
  security: [{ bearerAuth: [] }],
  request: {
    params: ModuleReleaseRulePathParams,
    body: { required: true, content: { 'application/json': { schema: UpdateReleaseRuleBody } } },
  },
  responses: {
    200: {
      description: 'Updated release rule.',
      content: { 'application/json': { schema: ModuleReleaseRuleResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const deleteModuleReleaseRuleRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-rules/{ruleId}',
  tags: ['ModuleRelease'],
  operationId: 'deleteModuleReleaseRule',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseRulePathParams },
  responses: {
    204: { description: 'Release rule deleted.' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertModuleReleasePolicyRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-policy',
  tags: ['ModuleRelease'],
  operationId: 'upsertModuleReleasePolicy',
  security: [{ bearerAuth: [] }],
  request: {
    params: ModuleReleaseModulePathParams,
    body: { required: true, content: { 'application/json': { schema: UpsertReleasePolicyBody } } },
  },
  responses: {
    200: {
      description: 'Module release policy.',
      content: { 'application/json': { schema: ModuleReleasePolicyResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getModuleReleasePolicyRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-policy',
  tags: ['ModuleRelease'],
  operationId: 'getModuleReleasePolicy',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseModulePathParams },
  responses: {
    200: {
      description: 'Explicit module release policy.',
      content: { 'application/json': { schema: ModuleReleasePolicyResponse } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const listModuleReleaseOverridesRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides',
  tags: ['ModuleRelease'],
  operationId: 'listModuleReleaseOverrides',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseModulePathParams },
  responses: {
    200: {
      description: 'Release overrides for the module.',
      content: { 'application/json': { schema: ModuleReleaseOverrideResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const upsertModuleReleaseOverrideRoute = createRoute({
  method: 'put',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides/{studentId}',
  tags: ['ModuleRelease'],
  operationId: 'upsertModuleReleaseOverride',
  security: [{ bearerAuth: [] }],
  request: {
    params: ModuleReleaseOverrideStudentPathParams,
    body: {
      required: true,
      content: { 'application/json': { schema: UpsertReleaseOverrideBody } },
    },
  },
  responses: {
    200: {
      description: 'Stored release override.',
      content: { 'application/json': { schema: ModuleReleaseOverrideResponse } },
    },
    400: badRequestResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const removeModuleReleaseOverrideRoute = createRoute({
  method: 'delete',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/release-overrides/{studentId}',
  tags: ['ModuleRelease'],
  operationId: 'removeModuleReleaseOverride',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseOverrideStudentPathParams },
  responses: {
    204: { description: 'Override removed.' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getMyModuleReleaseStatusRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/release-status',
  tags: ['ModuleRelease'],
  operationId: 'getMyModuleReleaseStatus',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseCoursePathParams },
  responses: {
    200: {
      description: 'Module and item release decisions for the calling user.',
      content: { 'application/json': { schema: ModuleReleaseDecisionResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

export const getStudentModuleReleaseStatusRoute = createRoute({
  method: 'get',
  path: '/api/v1/tenants/{tenantId}/courses/{courseId}/release-status/{studentId}',
  tags: ['ModuleRelease'],
  operationId: 'getStudentModuleReleaseStatus',
  security: [{ bearerAuth: [] }],
  request: { params: ModuleReleaseStudentCoursePathParams },
  responses: {
    200: {
      description: 'Module and item release decisions for a specific student.',
      content: { 'application/json': { schema: ModuleReleaseDecisionResponse.array() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});
