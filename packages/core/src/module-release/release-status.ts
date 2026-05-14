import type {
  CourseId,
  CourseModule,
  CourseModuleId,
  LearningObjectiveId,
  LearningObjectiveMastery,
  ModuleReleaseCombinator,
  ModuleReleaseDecision,
  ModuleReleaseOverride,
  ModuleReleasePolicy,
  ModuleReleaseRule,
  ModuleReleaseTargetType,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { type ObjectiveMasterySnapshot, evaluateModuleRelease } from './evaluator.ts';

export type ModuleReleaseStatusDependencies = {
  listCourseModules: (params: { tenantId: TenantId; courseId: CourseId }) => Promise<
    CourseModule[]
  >;
  listReleaseRulesForCourse: (params: {
    tenantId: TenantId;
    courseId: CourseId;
  }) => Promise<ModuleReleaseRule[]>;
  getReleasePoliciesForCourse: (params: {
    tenantId: TenantId;
    courseId: CourseId;
  }) => Promise<Map<CourseModuleId, ModuleReleasePolicy>>;
  listOverridesForStudent: (params: {
    tenantId: TenantId;
    courseId: CourseId;
    studentId: UserId;
  }) => Promise<Map<CourseModuleId, ModuleReleaseOverride>>;
  listMasteryForStudent: (params: {
    tenantId: TenantId;
    courseId: CourseId;
    studentId: UserId;
  }) => Promise<LearningObjectiveMastery[]>;
};

export type EvaluateCourseReleasesInput = {
  tenantId: TenantId;
  courseId: CourseId;
  studentId: UserId;
  now: Date;
};

type RuleTarget = {
  moduleId: CourseModuleId;
  targetType: ModuleReleaseTargetType;
  targetId: string | null;
};

type ReleaseRuleTarget = ModuleReleaseRule & {
  targetType?: ModuleReleaseTargetType;
  targetId?: string | null;
};

const getRuleTarget = (rule: ModuleReleaseRule): RuleTarget => {
  const target = rule as ReleaseRuleTarget;
  return {
    moduleId: rule.moduleId,
    targetType: target.targetType ?? 'module',
    targetId: target.targetId ?? null,
  };
};

const targetKey = (target: RuleTarget): string =>
  `${target.moduleId}:${target.targetType}:${target.targetId ?? 'module'}`;

export const evaluateCourseReleases = async (
  dependencies: ModuleReleaseStatusDependencies,
  input: EvaluateCourseReleasesInput,
): Promise<ModuleReleaseDecision[]> => {
  const [modules, rules, policiesByModule, overridesByModule, masteryRows] = await Promise.all([
    dependencies.listCourseModules({ tenantId: input.tenantId, courseId: input.courseId }),
    dependencies.listReleaseRulesForCourse({
      tenantId: input.tenantId,
      courseId: input.courseId,
    }),
    dependencies.getReleasePoliciesForCourse({
      tenantId: input.tenantId,
      courseId: input.courseId,
    }),
    dependencies.listOverridesForStudent({
      tenantId: input.tenantId,
      courseId: input.courseId,
      studentId: input.studentId,
    }),
    dependencies.listMasteryForStudent({
      tenantId: input.tenantId,
      courseId: input.courseId,
      studentId: input.studentId,
    }),
  ]);

  const masteryByObjectiveId = new Map<LearningObjectiveId, ObjectiveMasterySnapshot>();
  for (const row of masteryRows) {
    masteryByObjectiveId.set(row.learningObjectiveId, {
      status: row.status,
      score: row.score,
      maxScore: row.maxScore,
    });
  }

  const moduleObjectives = new Map<CourseModuleId, LearningObjectiveId[]>();
  for (const module of modules) {
    moduleObjectives.set(module.id, module.learningObjectiveIds);
  }

  const rulesByModule = new Map<CourseModuleId, ModuleReleaseRule[]>();
  const itemTargetsByKey = new Map<string, RuleTarget>();
  for (const rule of rules) {
    const list = rulesByModule.get(rule.moduleId) ?? [];
    list.push(rule);
    rulesByModule.set(rule.moduleId, list);

    const target = getRuleTarget(rule);
    if (target.targetType !== 'module') {
      itemTargetsByKey.set(targetKey(target), target);
    }
  }

  const decisions: ModuleReleaseDecision[] = modules.map((module) => {
    const moduleRules = rulesByModule.get(module.id) ?? [];
    const policy = policiesByModule.get(module.id);
    const combinator: ModuleReleaseCombinator = policy?.combinator ?? 'all';
    const override = overridesByModule.get(module.id) ?? null;

    return evaluateModuleRelease({
      tenantId: input.tenantId,
      courseId: input.courseId,
      moduleId: module.id,
      targetType: 'module',
      targetId: null,
      studentId: input.studentId,
      rules: moduleRules,
      combinator,
      override,
      masteryByObjectiveId,
      moduleObjectives,
      now: input.now,
    });
  });

  for (const target of itemTargetsByKey.values()) {
    const moduleRules = rulesByModule.get(target.moduleId) ?? [];
    const policy = policiesByModule.get(target.moduleId);
    const combinator: ModuleReleaseCombinator = policy?.combinator ?? 'all';

    decisions.push(
      evaluateModuleRelease({
        tenantId: input.tenantId,
        courseId: input.courseId,
        moduleId: target.moduleId,
        targetType: target.targetType,
        targetId: target.targetId,
        studentId: input.studentId,
        rules: moduleRules,
        combinator,
        override: null,
        masteryByObjectiveId,
        moduleObjectives,
        now: input.now,
      }),
    );
  }

  return decisions;
};
