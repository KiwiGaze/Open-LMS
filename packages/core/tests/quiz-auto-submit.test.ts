import { describe, expect, it } from 'vitest';
import { type ExpiredAttemptInput, findExpiredQuizAttemptIds } from '../src/quizzes/auto-submit.ts';

const t0 = new Date('2026-05-10T10:00:00.000Z');
const elapsed = (seconds: number): Date => new Date(t0.getTime() + seconds * 1000);

const attempt = (overrides: Partial<ExpiredAttemptInput> = {}): ExpiredAttemptInput => ({
  id: 'att-1',
  startedAt: t0,
  timeLimitMinutes: 30,
  status: 'in_progress',
  ...overrides,
});

describe('findExpiredQuizAttemptIds', () => {
  it('returns ids of in_progress attempts past their deadline', () => {
    expect(findExpiredQuizAttemptIds([attempt()], elapsed(31 * 60))).toEqual(['att-1']);
  });

  it('drops attempts that are no longer in_progress', () => {
    expect(findExpiredQuizAttemptIds([attempt({ status: 'submitted' })], elapsed(60 * 60))).toEqual(
      [],
    );
    expect(findExpiredQuizAttemptIds([attempt({ status: 'graded' })], elapsed(60 * 60))).toEqual(
      [],
    );
    expect(findExpiredQuizAttemptIds([attempt({ status: 'abandoned' })], elapsed(60 * 60))).toEqual(
      [],
    );
  });

  it('drops attempts whose quiz has no time limit', () => {
    expect(
      findExpiredQuizAttemptIds([attempt({ timeLimitMinutes: null })], elapsed(60 * 60)),
    ).toEqual([]);
  });

  it('returns nothing when no attempt has expired yet', () => {
    expect(findExpiredQuizAttemptIds([attempt()], elapsed(15 * 60))).toEqual([]);
  });

  it('returns nothing exactly at the deadline (inclusive)', () => {
    expect(findExpiredQuizAttemptIds([attempt()], elapsed(30 * 60))).toEqual([]);
  });

  it('returns expired ids across multiple attempts and preserves input order', () => {
    expect(
      findExpiredQuizAttemptIds(
        [
          attempt({ id: 'fresh', startedAt: elapsed(60), timeLimitMinutes: 60 }),
          attempt({ id: 'expired-a', startedAt: t0, timeLimitMinutes: 30 }),
          attempt({ id: 'finished', status: 'submitted', timeLimitMinutes: 30 }),
          attempt({ id: 'expired-b', startedAt: t0, timeLimitMinutes: 15 }),
        ],
        elapsed(31 * 60),
      ),
    ).toEqual(['expired-a', 'expired-b']);
  });
});
