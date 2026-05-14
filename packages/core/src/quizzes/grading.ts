import type { QuizGradingMethod } from '@openlms/contracts';

export type QuizAttemptScoreInput = {
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'abandoned';
  score: number | null;
};

export type QuizAttemptGradingInput = QuizAttemptScoreInput & {
  studentId: string;
  submittedAt: Date | null;
  updatedAt: Date;
};

export type AggregatedQuizGrade = {
  studentId: string;
  aggregateScore: number | null;
  attemptCount: number;
  latestAttemptAt: Date | null;
};

// Groups attempts by studentId, applies aggregateQuizAttemptScore per group,
// and returns one row per student with the aggregate score and bookkeeping
// fields. latestAttemptAt prefers submittedAt over updatedAt; null only when
// no attempt has been touched.
export const aggregateQuizGradesPerStudent = (
  attempts: QuizAttemptGradingInput[],
  method: QuizGradingMethod,
): AggregatedQuizGrade[] => {
  const byStudent = new Map<string, QuizAttemptGradingInput[]>();
  for (const attempt of attempts) {
    const list = byStudent.get(attempt.studentId);
    if (list) {
      list.push(attempt);
    } else {
      byStudent.set(attempt.studentId, [attempt]);
    }
  }

  return Array.from(byStudent.entries()).map(([studentId, studentAttempts]) => {
    const aggregate = aggregateQuizAttemptScore(studentAttempts, method);
    const latestAttemptAt = studentAttempts.reduce<Date | null>((latest, attempt) => {
      const candidate = attempt.submittedAt ?? attempt.updatedAt;
      if (!latest || candidate.getTime() > latest.getTime()) {
        return candidate;
      }
      return latest;
    }, null);

    return {
      studentId,
      aggregateScore: aggregate,
      attemptCount: studentAttempts.length,
      latestAttemptAt,
    };
  });
};

// Aggregates per-attempt scores into a single score for a learner. Returns
// null when no attempt has yielded a numeric score yet. Only 'graded' and
// 'submitted' attempts with a non-null score are considered.
export const aggregateQuizAttemptScore = (
  attempts: QuizAttemptScoreInput[],
  method: QuizGradingMethod,
): number | null => {
  const scored = attempts.filter(
    (attempt): attempt is QuizAttemptScoreInput & { score: number } =>
      attempt.score !== null && (attempt.status === 'graded' || attempt.status === 'submitted'),
  );

  if (scored.length === 0) {
    return null;
  }

  switch (method) {
    case 'best': {
      return Math.max(...scored.map((attempt) => attempt.score));
    }
    case 'last': {
      const sorted = [...scored].sort((a, b) => b.attemptNumber - a.attemptNumber);
      return sorted[0]?.score ?? null;
    }
    case 'first': {
      const sorted = [...scored].sort((a, b) => a.attemptNumber - b.attemptNumber);
      return sorted[0]?.score ?? null;
    }
    case 'average': {
      const total = scored.reduce((sum, attempt) => sum + attempt.score, 0);
      return total / scored.length;
    }
  }
};
