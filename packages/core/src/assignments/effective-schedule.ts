import type { AssignmentOverride } from '@openlms/contracts';

export type LearnerOverrideContext = {
  userId: string;
  groupIds: string[];
  sectionIds: string[];
};

// Filters a set of assignment overrides down to the entries that apply to a
// specific learner. Archived overrides are dropped — only active overrides
// influence the effective schedule.
export const filterAssignmentOverridesForLearner = (
  overrides: AssignmentOverride[],
  context: LearnerOverrideContext,
): AssignmentOverride[] => {
  const groupIdSet = new Set(context.groupIds);
  const sectionIdSet = new Set(context.sectionIds);

  return overrides.filter((override) => {
    if (override.status !== 'active') {
      return false;
    }
    switch (override.targetType) {
      case 'user':
        return override.targetId === context.userId;
      case 'group':
        return groupIdSet.has(override.targetId);
      case 'section':
        return sectionIdSet.has(override.targetId);
    }
  });
};

export type EffectiveScheduleInput = {
  baseDueAt: Date | null;
  overrides: AssignmentOverride[];
};

export type EffectiveSchedule = {
  opensAt: Date | null;
  dueAt: Date | null;
  closesAt: Date | null;
};

// Resolves the effective schedule for a learner given the base assignment due
// date and the overrides that already apply to them. Canvas-style semantics:
// opensAt picks the earliest override (most permissive start), dueAt and
// closesAt pick the latest override (most lenient deadline). When no override
// supplies a value the base assignment dueAt is used.
export const resolveEffectiveAssignmentSchedule = (
  input: EffectiveScheduleInput,
): EffectiveSchedule => {
  const opensAt = pickEarliest(input.overrides.map((override) => override.opensAt));
  const closesAt = pickLatest(input.overrides.map((override) => override.closesAt));
  const overrideDueAt = pickLatest(input.overrides.map((override) => override.dueAt));

  return {
    opensAt,
    dueAt: overrideDueAt ?? input.baseDueAt,
    closesAt,
  };
};

const pickEarliest = (dates: (Date | null)[]): Date | null => {
  const present = dates.filter((date): date is Date => date !== null);
  if (present.length === 0) {
    return null;
  }
  return present.reduce((earliest, current) =>
    current.getTime() < earliest.getTime() ? current : earliest,
  );
};

const pickLatest = (dates: (Date | null)[]): Date | null => {
  const present = dates.filter((date): date is Date => date !== null);
  if (present.length === 0) {
    return null;
  }
  return present.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
};
