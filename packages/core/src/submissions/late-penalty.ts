export type LatePenaltyInput = {
  dueAt: Date | null;
  submittedAt: Date;
  percentPerDay: number | null;
  maxPercent: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Returns the late penalty as a percentage (0..100) to deduct from a score.
// Late days are counted as the ceiling of the elapsed days past the due date,
// so a submission one minute late incurs the same penalty as one a full day late.
export const computeLatePenaltyPercent = (input: LatePenaltyInput): number => {
  if (input.dueAt === null || input.percentPerDay === null || input.percentPerDay <= 0) {
    return 0;
  }

  const elapsedMs = input.submittedAt.getTime() - input.dueAt.getTime();
  if (elapsedMs <= 0) {
    return 0;
  }

  const daysLate = Math.ceil(elapsedMs / MS_PER_DAY);
  const rawPenalty = daysLate * input.percentPerDay;
  const cap = input.maxPercent ?? 100;
  return Math.min(rawPenalty, cap);
};

export type ApplyLatePenaltyInput = {
  score: number;
  penaltyPercent: number;
};

// Applies the late-penalty percent to a raw score and returns the adjusted
// score, clamped at zero. A penaltyPercent of 100 returns 0; a penalty of 0
// returns the input score unchanged.
export const applyLatePenalty = (input: ApplyLatePenaltyInput): number => {
  const penalty = Math.min(Math.max(input.penaltyPercent, 0), 100);
  const adjusted = input.score * (1 - penalty / 100);
  return Math.max(adjusted, 0);
};
