import { and, eq } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { quiz, quizAttempt } from '../db/schema/quiz.ts';
import { isQuizAttemptExpired } from './time-limit.ts';

export type ExpiredAttemptInput = {
  id: string;
  startedAt: Date;
  timeLimitMinutes: number | null;
  status: 'in_progress' | 'submitted' | 'graded' | 'abandoned';
};

// Returns ids of in_progress attempts whose deadline has passed. Drops
// attempts that are no longer in_progress (already submitted, graded, or
// abandoned), and any that have no time limit configured.
export const findExpiredQuizAttemptIds = (attempts: ExpiredAttemptInput[], now: Date): string[] =>
  attempts
    .filter((attempt) => attempt.status === 'in_progress')
    .filter((attempt) =>
      isQuizAttemptExpired(
        { startedAt: attempt.startedAt, timeLimitMinutes: attempt.timeLimitMinutes },
        now,
      ),
    )
    .map((attempt) => attempt.id);

// Lists in-progress attempts with their parent quiz time limit so a sweep
// task can find which need auto-submission. Scoped per tenant; pass through
// findExpiredQuizAttemptIds to compute the actionable subset.
export const listInProgressQuizAttemptsForSweep = async (
  db: Database,
  tenantId: string,
): Promise<ExpiredAttemptInput[]> => {
  const rows = await db
    .select({
      id: quizAttempt.id,
      startedAt: quizAttempt.startedAt,
      timeLimitMinutes: quiz.timeLimitMinutes,
      status: quizAttempt.status,
    })
    .from(quizAttempt)
    .innerJoin(quiz, and(eq(quiz.tenantId, quizAttempt.tenantId), eq(quiz.id, quizAttempt.quizId)))
    .where(and(eq(quizAttempt.tenantId, tenantId), eq(quizAttempt.status, 'in_progress')));

  return rows.map((row) => ({
    id: row.id,
    startedAt: row.startedAt,
    timeLimitMinutes: row.timeLimitMinutes,
    status: row.status as ExpiredAttemptInput['status'],
  }));
};
