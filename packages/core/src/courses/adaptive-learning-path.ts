import {
  LearnerLearningPath,
  type LearnerLearningPath as LearnerLearningPathContract,
  type LearnerObjectiveState,
  type LearnerPathMode,
  LearningPathActivity,
  type LearningPathActivity as LearningPathActivityContract,
  type LearningPathActivityType,
  type LearningPathResourceType,
  type ModuleReleaseDecision,
} from '@openlms/contracts';

export type LearningPathModuleInput = {
  id: string;
  title: string;
  position: number;
  learningObjectiveIds: string[];
};

export type LearningPathResourceInput = {
  id: string;
  title: string;
  resourceType: LearningPathResourceType;
  moduleId: string | null;
  position: number | null;
  learningObjectiveIds: string[];
};

export type BuildLearnerLearningPathInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
  mode: LearnerPathMode;
  modules: LearningPathModuleInput[];
  resources: LearningPathResourceInput[];
  objectiveStates: LearnerObjectiveState[];
  generatedAt: Date;
};

const traditionalFallbackReason = 'Adaptive path unavailable: no learner evidence.';
const unreleasedAdaptiveFallbackReason =
  'Adaptive path unavailable: learner-state candidates are not released yet.';

const byPositionThenTitle = <T extends { position: number | null; title: string }>(
  left: T,
  right: T,
): number => {
  const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
  const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;
  if (leftPosition !== rightPosition) return leftPosition - rightPosition;
  return left.title.localeCompare(right.title);
};

const buildTraditionalActivities = (
  modules: LearningPathModuleInput[],
): LearningPathActivityContract[] =>
  modules
    .map((module) => ({
      ...module,
      position: module.position,
    }))
    .sort(byPositionThenTitle)
    .map((module, index) =>
      LearningPathActivity.parse({
        activityType: 'resource',
        title: module.title,
        objectiveIds: module.learningObjectiveIds,
        resource: {
          resourceType: 'course_module',
          resourceId: module.id,
          title: module.title,
          moduleId: module.id,
          position: module.position,
        },
        priority: Math.max(100 - index, 0),
        required: true,
        rationale: 'Traditional module order fallback.',
        selectionSignals: ['traditional_order'],
      }),
    );

const activityTypeForObjective = (state: LearnerObjectiveState): LearningPathActivityType => {
  if (state.readiness === 'remediate') return 'practice';
  if (state.readiness === 'blocked') return 'support';
  if (state.masteryStatus === 'mastered') return 'assessment';
  return 'resource';
};

const priorityForObjective = (state: LearnerObjectiveState): number => {
  const readinessWeight: Record<LearnerObjectiveState['readiness'], number> = {
    blocked: 90,
    remediate: 80,
    ready: 50,
    stretch: 30,
  };
  const confidencePenalty = Math.round((1 - state.confidence) * 20);
  const misconceptionWeight = state.misconceptionIds.length * 10;
  const score = readinessWeight[state.readiness] + confidencePenalty + misconceptionWeight;
  return Math.min(score, 100);
};

const rationaleForObjective = (state: LearnerObjectiveState): string => {
  if (state.misconceptionIds.length > 0) {
    return `Next-best activity addresses unresolved misconceptions: ${state.misconceptionIds.join(', ')}.`;
  }
  if (state.readiness === 'blocked') {
    return 'Next-best activity provides support because this objective is currently blocked.';
  }
  return `Next-best activity follows readiness ${state.readiness} with confidence ${state.confidence.toFixed(2)}.`;
};

const findResourceForObjective = (
  objectiveState: LearnerObjectiveState,
  resources: LearningPathResourceInput[],
): LearningPathResourceInput | null => {
  const matching = resources
    .filter((resource) => resource.learningObjectiveIds.includes(objectiveState.objectiveId))
    .sort(byPositionThenTitle);
  return matching[0] ?? null;
};

const buildAdaptiveActivities = (
  objectiveStates: LearnerObjectiveState[],
  resources: LearningPathResourceInput[],
): LearningPathActivityContract[] =>
  objectiveStates
    .map((state) => {
      const resource = findResourceForObjective(state, resources);
      const title = resource?.title ?? `Objective ${state.objectiveId}`;
      return LearningPathActivity.parse({
        activityType: activityTypeForObjective(state),
        title,
        objectiveIds: [state.objectiveId],
        resource:
          resource === null
            ? null
            : {
                resourceType: resource.resourceType,
                resourceId: resource.id,
                title: resource.title,
                moduleId: resource.moduleId,
                position: resource.position,
              },
        priority: priorityForObjective(state),
        required: state.readiness === 'blocked' || state.readiness === 'remediate',
        rationale: rationaleForObjective(state),
        selectionSignals: [
          `readiness:${state.readiness}`,
          state.misconceptionIds.length > 0 ? 'misconception_present' : 'no_misconception',
        ],
      });
    })
    .sort((left, right) => {
      if (left.priority !== right.priority) return right.priority - left.priority;
      return left.title.localeCompare(right.title);
    });

export const buildLearnerLearningPath = (
  input: BuildLearnerLearningPathInput,
): LearnerLearningPathContract => {
  const useTraditional = input.mode === 'traditional' || input.objectiveStates.length === 0;
  const activities = useTraditional
    ? buildTraditionalActivities(input.modules)
    : buildAdaptiveActivities(input.objectiveStates, input.resources);

  return LearnerLearningPath.parse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    studentId: input.studentId,
    mode: useTraditional ? 'traditional' : 'adaptive',
    generatedAt: input.generatedAt,
    objectiveStates: useTraditional ? [] : input.objectiveStates,
    activities,
    fallbackReason:
      input.mode === 'adaptive' && input.objectiveStates.length === 0
        ? traditionalFallbackReason
        : null,
  });
};

export type BuildReleasedLearnerLearningPathInput = BuildLearnerLearningPathInput & {
  releaseDecisions: ModuleReleaseDecision[];
};

const moduleDecisionForResource = (
  resource: LearningPathResourceInput,
  decisions: ModuleReleaseDecision[],
): ModuleReleaseDecision | null => {
  if (resource.moduleId === null) return null;
  return (
    decisions.find(
      (decision) => decision.targetType === 'module' && decision.moduleId === resource.moduleId,
    ) ?? null
  );
};

const itemDecisionForResource = (
  resource: LearningPathResourceInput,
  decisions: ModuleReleaseDecision[],
): ModuleReleaseDecision | null =>
  decisions.find(
    (decision) =>
      decision.targetType === resource.resourceType &&
      decision.targetId === resource.id &&
      decision.moduleId === resource.moduleId,
  ) ?? null;

const isResourceReleased = (
  resource: LearningPathResourceInput,
  decisions: ModuleReleaseDecision[],
): boolean => {
  const moduleDecision = moduleDecisionForResource(resource, decisions);
  const itemDecision = itemDecisionForResource(resource, decisions);
  return moduleDecision?.state !== 'locked' && itemDecision?.state !== 'locked';
};

const hasReleasedResourceForObjective = (
  state: LearnerObjectiveState,
  releasedResources: LearningPathResourceInput[],
): boolean =>
  releasedResources.some((resource) => resource.learningObjectiveIds.includes(state.objectiveId));

const hasAnyResourceForObjective = (
  state: LearnerObjectiveState,
  resources: LearningPathResourceInput[],
): boolean =>
  resources.some((resource) => resource.learningObjectiveIds.includes(state.objectiveId));

const addReleaseSelectionSignals = (
  activities: LearningPathActivityContract[],
): LearningPathActivityContract[] =>
  activities.map((activity) =>
    LearningPathActivity.parse({
      ...activity,
      selectionSignals: Array.from(new Set([...activity.selectionSignals, 'release_available'])),
    }),
  );

export const buildReleasedLearnerLearningPath = (
  input: BuildReleasedLearnerLearningPathInput,
): LearnerLearningPathContract => {
  if (input.mode === 'traditional' || input.objectiveStates.length === 0) {
    return buildLearnerLearningPath(input);
  }

  const releasedResources = input.resources.filter((resource) =>
    isResourceReleased(resource, input.releaseDecisions),
  );
  const releasedObjectiveStates = input.objectiveStates.filter((state) => {
    if (hasReleasedResourceForObjective(state, releasedResources)) return true;
    return state.readiness === 'blocked' && !hasAnyResourceForObjective(state, input.resources);
  });

  if (releasedObjectiveStates.length === 0) {
    const fallback = buildLearnerLearningPath({
      ...input,
      mode: 'traditional',
      objectiveStates: [],
      resources: [],
    });

    return LearnerLearningPath.parse({
      ...fallback,
      fallbackReason: unreleasedAdaptiveFallbackReason,
    });
  }

  const path = buildLearnerLearningPath({
    ...input,
    objectiveStates: releasedObjectiveStates,
    resources: releasedResources,
  });

  return LearnerLearningPath.parse({
    ...path,
    activities: addReleaseSelectionSignals(path.activities),
  });
};
