import { z } from 'zod';
import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  LearningObjectiveId,
  TenantId,
  UserId,
} from './ids.ts';

export const ModuleReleaseRuleType = z.enum([
  'prerequisite_modules',
  'objective_mastery',
  'date_after',
  'manual_unlock',
]);
export type ModuleReleaseRuleType = z.infer<typeof ModuleReleaseRuleType>;

export const ModuleReleaseRuleStatus = z.enum(['active', 'archived']);
export type ModuleReleaseRuleStatus = z.infer<typeof ModuleReleaseRuleStatus>;

export const ModuleReleaseCombinator = z.enum(['all', 'any']);
export type ModuleReleaseCombinator = z.infer<typeof ModuleReleaseCombinator>;

export const ModuleReleaseTargetType = z.enum([
  'module',
  'course_page',
  'course_resource',
  'assignment',
]);
export type ModuleReleaseTargetType = z.infer<typeof ModuleReleaseTargetType>;

export const ModuleReleaseOverrideState = z.enum(['unlocked', 'locked']);
export type ModuleReleaseOverrideState = z.infer<typeof ModuleReleaseOverrideState>;

export const ModuleReleaseMasteryStatus = z.enum(['developing', 'proficient', 'mastered']);
export type ModuleReleaseMasteryStatus = z.infer<typeof ModuleReleaseMasteryStatus>;

export const ModuleReleasePrerequisiteModulesConfig = z
  .object({
    moduleIds: z.array(CourseModuleId).min(1).max(50),
    requireAll: z.boolean(),
  })
  .strict();
export type ModuleReleasePrerequisiteModulesConfig = z.infer<
  typeof ModuleReleasePrerequisiteModulesConfig
>;

export const ModuleReleaseObjectiveMasteryConfig = z
  .object({
    objectiveId: LearningObjectiveId,
    minStatus: ModuleReleaseMasteryStatus,
    minScorePercent: z.number().min(0).max(100).nullable(),
  })
  .strict();
export type ModuleReleaseObjectiveMasteryConfig = z.infer<
  typeof ModuleReleaseObjectiveMasteryConfig
>;

export const ModuleReleaseDateAfterConfig = z
  .object({
    releaseAt: z.coerce.date(),
  })
  .strict();
export type ModuleReleaseDateAfterConfig = z.infer<typeof ModuleReleaseDateAfterConfig>;

export const ModuleReleaseManualUnlockConfig = z
  .object({
    defaultLocked: z.boolean(),
  })
  .strict();
export type ModuleReleaseManualUnlockConfig = z.infer<typeof ModuleReleaseManualUnlockConfig>;

const moduleReleaseRuleBaseShape = {
  id: CourseModuleReleaseRuleId,
  tenantId: TenantId,
  courseId: CourseId,
  moduleId: CourseModuleId,
  targetType: ModuleReleaseTargetType.default('module'),
  targetId: z.string().min(1).max(128).nullable().default(null),
  position: z.number().int().nonnegative(),
  status: ModuleReleaseRuleStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
};

const refineReleaseTarget = <
  T extends {
    targetType: ModuleReleaseTargetType;
    targetId: string | null;
  },
>(
  value: T,
  context: z.RefinementCtx,
): void => {
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
};

export const ModuleReleaseRule = z
  .discriminatedUnion('ruleType', [
    z
      .object({
        ...moduleReleaseRuleBaseShape,
        ruleType: z.literal('prerequisite_modules'),
        config: ModuleReleasePrerequisiteModulesConfig,
      })
      .strict(),
    z
      .object({
        ...moduleReleaseRuleBaseShape,
        ruleType: z.literal('objective_mastery'),
        config: ModuleReleaseObjectiveMasteryConfig,
      })
      .strict(),
    z
      .object({
        ...moduleReleaseRuleBaseShape,
        ruleType: z.literal('date_after'),
        config: ModuleReleaseDateAfterConfig,
      })
      .strict(),
    z
      .object({
        ...moduleReleaseRuleBaseShape,
        ruleType: z.literal('manual_unlock'),
        config: ModuleReleaseManualUnlockConfig,
      })
      .strict(),
  ])
  .superRefine((rule, context) => {
    refineReleaseTarget(rule, context);

    if (rule.ruleType === 'manual_unlock' && rule.targetType !== 'module') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Manual unlock release rules can only target modules because overrides are module-scoped.',
        path: ['targetType'],
      });
    }
  });
export type ModuleReleaseRule = z.infer<typeof ModuleReleaseRule>;

export const ModuleReleasePolicy = z
  .object({
    id: CourseModuleReleasePolicyId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId,
    combinator: ModuleReleaseCombinator,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ModuleReleasePolicy = z.infer<typeof ModuleReleasePolicy>;

export const ModuleReleaseOverride = z
  .object({
    id: CourseModuleReleaseOverrideId,
    tenantId: TenantId,
    courseId: CourseId,
    moduleId: CourseModuleId,
    studentId: UserId,
    state: ModuleReleaseOverrideState,
    reason: z.string().min(1).max(2_000).nullable(),
    grantedByUserId: UserId.nullable(),
    grantedAt: z.date(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ModuleReleaseOverride = z.infer<typeof ModuleReleaseOverride>;

export const ModuleReleaseState = z.enum(['released', 'locked']);
export type ModuleReleaseState = z.infer<typeof ModuleReleaseState>;

export const ModuleReleaseRuleResult = z
  .object({
    ruleId: CourseModuleReleaseRuleId,
    ruleType: ModuleReleaseRuleType,
    passed: z.boolean(),
    summary: z.string().min(1).max(500),
  })
  .strict();
export type ModuleReleaseRuleResult = z.infer<typeof ModuleReleaseRuleResult>;

export const ModuleReleaseBlocker = z
  .object({
    ruleType: ModuleReleaseRuleType,
    summary: z.string().min(1).max(500),
    requiredAction: z.string().min(1).max(500),
  })
  .strict();
export type ModuleReleaseBlocker = z.infer<typeof ModuleReleaseBlocker>;

export const ModuleReleaseDecisionOverrideRef = z
  .object({
    overrideId: CourseModuleReleaseOverrideId,
    state: ModuleReleaseOverrideState,
    reason: z.string().min(1).max(2_000).nullable(),
  })
  .strict();
export type ModuleReleaseDecisionOverrideRef = z.infer<typeof ModuleReleaseDecisionOverrideRef>;

export const ModuleReleaseDecision = z
  .object({
    moduleId: CourseModuleId,
    targetType: ModuleReleaseTargetType,
    targetId: z.string().min(1).max(128).nullable(),
    state: ModuleReleaseState,
    evaluatedAt: z.date(),
    sourceCombinator: ModuleReleaseCombinator,
    ruleResults: z.array(ModuleReleaseRuleResult),
    blockers: z.array(ModuleReleaseBlocker),
    override: ModuleReleaseDecisionOverrideRef.nullable(),
  })
  .strict()
  .superRefine(refineReleaseTarget);
export type ModuleReleaseDecision = z.infer<typeof ModuleReleaseDecision>;
