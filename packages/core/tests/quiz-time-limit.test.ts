import { describe, expect, it } from 'vitest';
import {
  computeQuizAttemptDeadline,
  isQuizAttemptExpired,
  quizAttemptTimeRemainingSeconds,
} from '../src/quizzes/time-limit.ts';

const startedAt = new Date('2026-05-10T10:00:00.000Z');

describe('computeQuizAttemptDeadline', () => {
  it('returns null when timeLimitMinutes is null', () => {
    expect(computeQuizAttemptDeadline({ startedAt, timeLimitMinutes: null })).toBeNull();
  });

  it('returns null when timeLimitMinutes is zero', () => {
    expect(computeQuizAttemptDeadline({ startedAt, timeLimitMinutes: 0 })).toBeNull();
  });

  it('adds the time limit to startedAt', () => {
    const deadline = computeQuizAttemptDeadline({ startedAt, timeLimitMinutes: 45 });
    expect(deadline?.toISOString()).toBe('2026-05-10T10:45:00.000Z');
  });

  it('handles a long time limit (24 hours)', () => {
    const deadline = computeQuizAttemptDeadline({ startedAt, timeLimitMinutes: 24 * 60 });
    expect(deadline?.toISOString()).toBe('2026-05-11T10:00:00.000Z');
  });
});

describe('isQuizAttemptExpired', () => {
  it('returns false when there is no time limit', () => {
    expect(
      isQuizAttemptExpired(
        { startedAt, timeLimitMinutes: null },
        new Date('2030-01-01T00:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('returns false right before the deadline', () => {
    expect(
      isQuizAttemptExpired(
        { startedAt, timeLimitMinutes: 30 },
        new Date('2026-05-10T10:29:59.000Z'),
      ),
    ).toBe(false);
  });

  it('returns false exactly at the deadline (deadline is inclusive)', () => {
    expect(
      isQuizAttemptExpired(
        { startedAt, timeLimitMinutes: 30 },
        new Date('2026-05-10T10:30:00.000Z'),
      ),
    ).toBe(false);
  });

  it('returns true one second after the deadline', () => {
    expect(
      isQuizAttemptExpired(
        { startedAt, timeLimitMinutes: 30 },
        new Date('2026-05-10T10:30:01.000Z'),
      ),
    ).toBe(true);
  });
});

describe('quizAttemptTimeRemainingSeconds', () => {
  it('returns null when there is no time limit', () => {
    expect(
      quizAttemptTimeRemainingSeconds(
        { startedAt, timeLimitMinutes: null },
        new Date('2026-05-10T10:15:00.000Z'),
      ),
    ).toBeNull();
  });

  it('returns the full window when now equals startedAt', () => {
    expect(quizAttemptTimeRemainingSeconds({ startedAt, timeLimitMinutes: 30 }, startedAt)).toBe(
      1800,
    );
  });

  it('returns positive seconds before the deadline', () => {
    expect(
      quizAttemptTimeRemainingSeconds(
        { startedAt, timeLimitMinutes: 30 },
        new Date('2026-05-10T10:20:00.000Z'),
      ),
    ).toBe(600);
  });

  it('returns zero exactly at the deadline', () => {
    expect(
      quizAttemptTimeRemainingSeconds(
        { startedAt, timeLimitMinutes: 30 },
        new Date('2026-05-10T10:30:00.000Z'),
      ),
    ).toBe(0);
  });

  it('returns a negative value after the deadline', () => {
    expect(
      quizAttemptTimeRemainingSeconds(
        { startedAt, timeLimitMinutes: 30 },
        new Date('2026-05-10T10:31:00.000Z'),
      ),
    ).toBe(-60);
  });
});
