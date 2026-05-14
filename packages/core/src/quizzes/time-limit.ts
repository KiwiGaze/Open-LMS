export type QuizAttemptDeadlineInput = {
  startedAt: Date;
  timeLimitMinutes: number | null;
};

const MS_PER_MINUTE = 60 * 1000;

// Returns the exact moment by which a quiz attempt must be submitted, or null
// if the quiz has no time limit. Callers use this to render countdown timers
// and reject late response writes.
export const computeQuizAttemptDeadline = (input: QuizAttemptDeadlineInput): Date | null => {
  if (input.timeLimitMinutes === null || input.timeLimitMinutes <= 0) {
    return null;
  }

  return new Date(input.startedAt.getTime() + input.timeLimitMinutes * MS_PER_MINUTE);
};

export const isQuizAttemptExpired = (
  input: QuizAttemptDeadlineInput,
  now = new Date(),
): boolean => {
  const deadline = computeQuizAttemptDeadline(input);
  if (deadline === null) {
    return false;
  }

  return now.getTime() > deadline.getTime();
};

// Returns the seconds remaining until the deadline, or null when there is no
// time limit. The value is negative once the deadline has passed, allowing
// callers to report exactly how late an attempt is.
export const quizAttemptTimeRemainingSeconds = (
  input: QuizAttemptDeadlineInput,
  now = new Date(),
): number | null => {
  const deadline = computeQuizAttemptDeadline(input);
  if (deadline === null) {
    return null;
  }

  return Math.round((deadline.getTime() - now.getTime()) / 1000);
};
