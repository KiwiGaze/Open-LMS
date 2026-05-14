import { describe, expect, it } from 'vitest';
import {
  type QuizAttemptGradingInput,
  type QuizAttemptScoreInput,
  aggregateQuizAttemptScore,
  aggregateQuizGradesPerStudent,
} from '../src/quizzes/grading.ts';

const attempt = (
  attemptNumber: number,
  score: number | null,
  status: QuizAttemptScoreInput['status'] = 'graded',
): QuizAttemptScoreInput => ({ attemptNumber, score, status });

const baseAttempt = (
  studentId: string,
  attemptNumber: number,
  score: number | null,
  submittedAt: Date | null = new Date('2026-05-10T00:00:00.000Z'),
): QuizAttemptGradingInput => ({
  studentId,
  attemptNumber,
  status: 'graded',
  score,
  submittedAt,
  updatedAt: submittedAt ?? new Date('2026-05-10T00:00:00.000Z'),
});

describe('aggregateQuizAttemptScore', () => {
  it('returns null when no attempts exist', () => {
    expect(aggregateQuizAttemptScore([], 'best')).toBeNull();
  });

  it('returns null when all attempts lack a score', () => {
    expect(
      aggregateQuizAttemptScore([attempt(1, null, 'in_progress'), attempt(2, null)], 'best'),
    ).toBeNull();
  });

  it('returns null when only in_progress or abandoned attempts have scores', () => {
    expect(
      aggregateQuizAttemptScore([attempt(1, 7, 'in_progress'), attempt(2, 8, 'abandoned')], 'best'),
    ).toBeNull();
  });

  it('best: picks the highest scored attempt', () => {
    expect(aggregateQuizAttemptScore([attempt(1, 7), attempt(2, 9), attempt(3, 5)], 'best')).toBe(
      9,
    );
  });

  it('first: returns the lowest attemptNumber with a score', () => {
    expect(aggregateQuizAttemptScore([attempt(2, 9), attempt(1, 5), attempt(3, 7)], 'first')).toBe(
      5,
    );
  });

  it('last: returns the highest attemptNumber with a score', () => {
    expect(aggregateQuizAttemptScore([attempt(1, 5), attempt(3, 7), attempt(2, 9)], 'last')).toBe(
      7,
    );
  });

  it('average: returns the arithmetic mean of all scored attempts', () => {
    expect(
      aggregateQuizAttemptScore([attempt(1, 6), attempt(2, 8), attempt(3, 10)], 'average'),
    ).toBe(8);
  });

  it('average: handles a single scored attempt', () => {
    expect(aggregateQuizAttemptScore([attempt(1, 7.5)], 'average')).toBe(7.5);
  });

  it('skips null-scored attempts when computing first/last', () => {
    expect(
      aggregateQuizAttemptScore(
        [attempt(1, null, 'in_progress'), attempt(2, 8), attempt(3, 6)],
        'first',
      ),
    ).toBe(8);
    expect(
      aggregateQuizAttemptScore(
        [attempt(1, 8), attempt(2, 6), attempt(3, null, 'in_progress')],
        'last',
      ),
    ).toBe(6);
  });

  it('counts submitted-but-not-yet-graded attempts toward the aggregate', () => {
    expect(
      aggregateQuizAttemptScore([attempt(1, 5, 'graded'), attempt(2, 9, 'submitted')], 'best'),
    ).toBe(9);
  });
});

describe('aggregateQuizGradesPerStudent', () => {
  it('returns an empty array when no attempts are provided', () => {
    expect(aggregateQuizGradesPerStudent([], 'best')).toEqual([]);
  });

  it('groups attempts by studentId and applies the aggregator per group', () => {
    const grades = aggregateQuizGradesPerStudent(
      [baseAttempt('s1', 1, 7), baseAttempt('s1', 2, 9), baseAttempt('s2', 1, 5)],
      'best',
    );

    expect(grades).toEqual([
      expect.objectContaining({ studentId: 's1', aggregateScore: 9, attemptCount: 2 }),
      expect.objectContaining({ studentId: 's2', aggregateScore: 5, attemptCount: 1 }),
    ]);
  });

  it('uses the configured grading method per student', () => {
    const grades = aggregateQuizGradesPerStudent(
      [baseAttempt('s1', 1, 4), baseAttempt('s1', 2, 8)],
      'average',
    );

    expect(grades[0]?.aggregateScore).toBe(6);
  });

  it('reports null aggregateScore when no attempt is scored', () => {
    const grades = aggregateQuizGradesPerStudent(
      [
        { ...baseAttempt('s1', 1, null), status: 'in_progress' },
        { ...baseAttempt('s1', 2, null), status: 'in_progress' },
      ],
      'best',
    );

    expect(grades[0]?.aggregateScore).toBeNull();
    expect(grades[0]?.attemptCount).toBe(2);
  });

  it('reports latestAttemptAt as the most recent submission across attempts', () => {
    const earlier = new Date('2026-05-10T00:00:00.000Z');
    const later = new Date('2026-05-12T00:00:00.000Z');
    const grades = aggregateQuizGradesPerStudent(
      [baseAttempt('s1', 1, 5, earlier), baseAttempt('s1', 2, 8, later)],
      'best',
    );

    expect(grades[0]?.latestAttemptAt).toEqual(later);
  });
});
