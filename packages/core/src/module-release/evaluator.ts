import type {
  CourseId,
  CourseModuleId,
  LearningObjectiveId,
  ModuleReleaseBlocker,
  ModuleReleaseCombinator,
  ModuleReleaseDecision,
  ModuleReleaseDecisionOverrideRef,
  ModuleReleaseOverride,
  ModuleReleaseRule,
  ModuleReleaseRuleResult,
  ModuleReleaseTargetType,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { ModuleReleaseDecision as ModuleReleaseDecisionSchema } from '@openlms/contracts';

export type ObjectiveMasterySnapshot = {
  status: 'not_assessed' | 'developing' | 'proficient' | 'mastered';
  score: number | null;
  maxScore: number | null;
};

export type ModuleReleaseEvaluatorInput = {
  tenantId: TenantId;
  courseId: CourseId;
  moduleId: CourseModuleId;
  targetType: ModuleReleaseTargetType;
  targetId: string | null;
  studentId: UserId;
  rules: ModuleReleaseRule[];
  combinator: ModuleReleaseCombinator;
  override: ModuleReleaseOverride | null;
  masteryByObjectiveId: Map<LearningObjectiveId, ObjectiveMasterySnapshot>;
  moduleObjectives: Map<CourseModuleId, LearningObjectiveId[]>;
  now: Date;
};

const masteryStatusRank: Record<ObjectiveMasterySnapshot['status'], number> = {
  not_assessed: 0,
  developing: 1,
  proficient: 2,
  mastered: 3,
};

const minStatusRank: Record<'developing' | 'proficient' | 'mastered', number> = {
  developing: 1,
  proficient: 2,
  mastered: 3,
};

const isOverrideActive = (override: ModuleReleaseOverride, now: Date): boolean => {
  if (override.expiresAt === null) return true;
  return override.expiresAt.getTime() > now.getTime();
};

type RuleEvaluation = {
  passed: boolean;
  summary: string;
  blocker?: ModuleReleaseBlocker;
};

type ReleaseRuleTarget = ModuleReleaseRule & {
  targetType?: ModuleReleaseTargetType;
  targetId?: string | null;
};

const getRuleTargetType = (rule: ModuleReleaseRule): ModuleReleaseTargetType =>
  (rule as ReleaseRuleTarget).targetType ?? 'module';

const getRuleTargetId = (rule: ModuleReleaseRule): string | null =>
  (rule as ReleaseRuleTarget).targetId ?? null;

const ruleMatchesTarget = (rule: ModuleReleaseRule, input: ModuleReleaseEvaluatorInput): boolean =>
  getRuleTargetType(rule) === input.targetType && getRuleTargetId(rule) === input.targetId;

const releaseTargetLabel = (targetType: ModuleReleaseTargetType): string => {
  switch (targetType) {
    case 'module':
      return 'Module';
    case 'assignment':
      return 'Assignment';
    case 'course_page':
      return 'Page';
    case 'course_resource':
      return 'Resource';
  }
};

const evaluateRule = (
  rule: ModuleReleaseRule,
  input: ModuleReleaseEvaluatorInput,
): RuleEvaluation => {
  const targetLabel = releaseTargetLabel(input.targetType);

  switch (rule.ruleType) {
    case 'date_after': {
      const releaseAt = rule.config.releaseAt;
      const passed = input.now.getTime() >= releaseAt.getTime();
      if (passed) {
        return { passed: true, summary: `${targetLabel} open since ${releaseAt.toISOString()}` };
      }
      return {
        passed: false,
        summary: `${targetLabel} opens at ${releaseAt.toISOString()}`,
        blocker: {
          ruleType: 'date_after',
          summary: `${targetLabel} is scheduled to open at ${releaseAt.toISOString()}`,
          requiredAction: 'Wait until the scheduled release time.',
        },
      };
    }
    case 'objective_mastery': {
      const mastery = input.masteryByObjectiveId.get(rule.config.objectiveId);
      const requiredRank = minStatusRank[rule.config.minStatus];
      const actualRank = mastery ? masteryStatusRank[mastery.status] : 0;
      if (actualRank < requiredRank) {
        return {
          passed: false,
          summary: `Mastery status is ${mastery?.status ?? 'not_assessed'}, requires ${rule.config.minStatus}`,
          blocker: {
            ruleType: 'objective_mastery',
            summary: `Reach ${rule.config.minStatus} mastery on the prerequisite objective`,
            requiredAction: 'Complete additional practice or assessments on this objective.',
          },
        };
      }
      if (rule.config.minScorePercent !== null && mastery) {
        if (mastery.score === null || mastery.maxScore === null || mastery.maxScore <= 0) {
          return {
            passed: false,
            summary: 'No score evidence yet — minimum score required',
            blocker: {
              ruleType: 'objective_mastery',
              summary: `Reach at least ${rule.config.minScorePercent}% on the prerequisite objective`,
              requiredAction: 'Complete a graded assessment on this objective.',
            },
          };
        }
        const percent = (mastery.score / mastery.maxScore) * 100;
        if (percent < rule.config.minScorePercent) {
          return {
            passed: false,
            summary: `Score ${percent.toFixed(1)}% below threshold ${rule.config.minScorePercent}%`,
            blocker: {
              ruleType: 'objective_mastery',
              summary: `Reach at least ${rule.config.minScorePercent}% on the prerequisite objective`,
              requiredAction: 'Improve your score on this objective.',
            },
          };
        }
      }
      return {
        passed: true,
        summary: `Mastery status ${mastery?.status ?? 'not_assessed'} satisfies threshold ${rule.config.minStatus}`,
      };
    }
    case 'prerequisite_modules': {
      const moduleStatuses = rule.config.moduleIds.map((prereqId) => {
        const objectiveIds = input.moduleObjectives.get(prereqId) ?? [];
        if (objectiveIds.length === 0) {
          return { moduleId: prereqId, completed: false };
        }
        const allMastered = objectiveIds.every((objectiveId) => {
          const mastery = input.masteryByObjectiveId.get(objectiveId);
          if (!mastery) return false;
          return masteryStatusRank[mastery.status] >= masteryStatusRank.proficient;
        });
        return { moduleId: prereqId, completed: allMastered };
      });
      const passed = rule.config.requireAll
        ? moduleStatuses.every((entry) => entry.completed)
        : moduleStatuses.some((entry) => entry.completed);
      if (!passed) {
        return {
          passed: false,
          summary: rule.config.requireAll
            ? 'Not all prerequisite modules have been mastered'
            : 'No prerequisite module has been mastered yet',
          blocker: {
            ruleType: 'prerequisite_modules',
            summary: rule.config.requireAll
              ? 'Master every objective in the prerequisite modules'
              : 'Master every objective in at least one prerequisite module',
            requiredAction:
              'Complete the prerequisite module activities until each objective reaches proficient mastery.',
          },
        };
      }
      return { passed: true, summary: 'Prerequisite mastery requirements satisfied' };
    }
    case 'manual_unlock': {
      const passed = !rule.config.defaultLocked;
      if (!passed) {
        return {
          passed: false,
          summary: 'Manual unlock required',
          blocker: {
            ruleType: 'manual_unlock',
            summary: `${targetLabel} requires an instructor unlock for this learner`,
            requiredAction: 'Ask your instructor for access.',
          },
        };
      }
      return { passed: true, summary: 'Manual unlock policy currently open' };
    }
  }
};

export const evaluateModuleRelease = (
  input: ModuleReleaseEvaluatorInput,
): ModuleReleaseDecision => {
  const activeOverride =
    input.targetType === 'module' && input.override && isOverrideActive(input.override, input.now)
      ? input.override
      : null;
  const overrideRef: ModuleReleaseDecisionOverrideRef | null = activeOverride
    ? {
        overrideId: activeOverride.id,
        state: activeOverride.state,
        reason: activeOverride.reason,
      }
    : null;

  if (activeOverride !== null) {
    return ModuleReleaseDecisionSchema.parse({
      moduleId: input.moduleId,
      targetType: input.targetType,
      targetId: input.targetId,
      state: activeOverride.state === 'unlocked' ? 'released' : 'locked',
      evaluatedAt: input.now,
      sourceCombinator: input.combinator,
      ruleResults: [],
      blockers:
        activeOverride.state === 'locked'
          ? [
              {
                ruleType: 'manual_unlock',
                summary: activeOverride.reason ?? 'Locked by instructor override',
                requiredAction: 'Contact your instructor for more information.',
              },
            ]
          : [],
      override: overrideRef,
    });
  }

  const activeRules = input.rules.filter((rule) => rule.status === 'active');
  const targetRules = activeRules.filter((rule) => ruleMatchesTarget(rule, input));
  if (targetRules.length === 0) {
    return ModuleReleaseDecisionSchema.parse({
      moduleId: input.moduleId,
      targetType: input.targetType,
      targetId: input.targetId,
      state: 'released',
      evaluatedAt: input.now,
      sourceCombinator: input.combinator,
      ruleResults: [],
      blockers: [],
      override: null,
    });
  }

  const evaluations = targetRules.map((rule) => {
    const outcome = evaluateRule(rule, input);
    const ruleResult: ModuleReleaseRuleResult = {
      ruleId: rule.id,
      ruleType: rule.ruleType,
      passed: outcome.passed,
      summary: outcome.summary,
    };
    return { ruleResult, blocker: outcome.blocker };
  });

  const passed =
    input.combinator === 'all'
      ? evaluations.every((entry) => entry.ruleResult.passed)
      : evaluations.some((entry) => entry.ruleResult.passed);

  const blockers: ModuleReleaseBlocker[] = passed
    ? []
    : evaluations
        .filter(
          (
            entry,
          ): entry is { ruleResult: ModuleReleaseRuleResult; blocker: ModuleReleaseBlocker } =>
            !entry.ruleResult.passed && entry.blocker !== undefined,
        )
        .map((entry) => entry.blocker);

  return ModuleReleaseDecisionSchema.parse({
    moduleId: input.moduleId,
    targetType: input.targetType,
    targetId: input.targetId,
    state: passed ? 'released' : 'locked',
    evaluatedAt: input.now,
    sourceCombinator: input.combinator,
    ruleResults: evaluations.map((entry) => entry.ruleResult),
    blockers,
    override: null,
  });
};
