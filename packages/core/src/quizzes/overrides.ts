import type { QuizOverride } from '@openlms/contracts';

export type QuizOverrideLearnerContext = {
  userId: string;
  groupIds: string[];
  sectionIds: string[];
};

export const filterQuizOverridesForLearner = (
  overrides: QuizOverride[],
  context: QuizOverrideLearnerContext,
): QuizOverride[] => {
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

export type EffectiveQuizSettingsInput = {
  quizId: string;
  baseOpensAt: Date | null;
  baseClosesAt: Date | null;
  baseTimeLimitMinutes: number | null;
  baseMaxAttempts: number;
  overrides: QuizOverride[];
};

export type EffectiveQuizSettings = {
  quizId: string;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  maxAttempts: number;
};

export const resolveEffectiveQuizSettings = (
  input: EffectiveQuizSettingsInput,
): EffectiveQuizSettings => ({
  quizId: input.quizId,
  opensAt: resolveEffectiveOpensAt(
    input.baseOpensAt,
    input.overrides.map((override) => override.opensAt),
  ),
  closesAt: resolveEffectiveClosesAt(
    input.baseClosesAt,
    input.overrides.map((override) => override.closesAt),
  ),
  timeLimitMinutes: resolveEffectiveTimeLimit(
    input.baseTimeLimitMinutes,
    input.overrides.map((override) => override.timeLimitMinutes),
  ),
  maxAttempts: Math.max(
    input.baseMaxAttempts,
    ...input.overrides
      .map((override) => override.maxAttempts)
      .filter((maxAttempts): maxAttempts is number => maxAttempts !== null),
  ),
});

const resolveEffectiveOpensAt = (
  baseOpensAt: Date | null,
  overrideOpensAt: (Date | null)[],
): Date | null => {
  if (baseOpensAt === null) {
    return null;
  }

  return pickEarliest([baseOpensAt, ...overrideOpensAt]);
};

const resolveEffectiveClosesAt = (
  baseClosesAt: Date | null,
  overrideClosesAt: (Date | null)[],
): Date | null => {
  if (baseClosesAt === null) {
    return null;
  }

  return pickLatest([baseClosesAt, ...overrideClosesAt]);
};

const resolveEffectiveTimeLimit = (
  baseTimeLimitMinutes: number | null,
  overrideTimeLimits: (number | null)[],
): number | null => {
  if (baseTimeLimitMinutes === null) {
    return null;
  }

  return Math.max(
    baseTimeLimitMinutes,
    ...overrideTimeLimits.filter((timeLimit): timeLimit is number => timeLimit !== null),
  );
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
