import { describe, expect, it } from 'vitest';
import { applyLatePenalty, computeLatePenaltyPercent } from '../src/submissions/late-penalty.ts';

const dueAt = new Date('2026-05-10T00:00:00.000Z');

describe('computeLatePenaltyPercent', () => {
  it('returns 0 when dueAt is null', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt: null,
        submittedAt: new Date('2026-05-12T00:00:00.000Z'),
        percentPerDay: 20,
        maxPercent: null,
      }),
    ).toBe(0);
  });

  it('returns 0 when percentPerDay is null', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-05-12T00:00:00.000Z'),
        percentPerDay: null,
        maxPercent: null,
      }),
    ).toBe(0);
  });

  it('returns 0 when submitted exactly at the due date', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: dueAt,
        percentPerDay: 10,
        maxPercent: null,
      }),
    ).toBe(0);
  });

  it('returns 0 when submitted before the due date', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-05-09T12:00:00.000Z'),
        percentPerDay: 10,
        maxPercent: null,
      }),
    ).toBe(0);
  });

  it('counts a partial day as one full late day (ceiling)', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-05-10T00:01:00.000Z'),
        percentPerDay: 10,
        maxPercent: null,
      }),
    ).toBe(10);
  });

  it('multiplies the daily rate by the number of days late', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-05-13T00:00:00.000Z'),
        percentPerDay: 15,
        maxPercent: null,
      }),
    ).toBe(45);
  });

  it('caps the penalty at maxPercent when provided', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-06-10T00:00:00.000Z'),
        percentPerDay: 10,
        maxPercent: 50,
      }),
    ).toBe(50);
  });

  it('caps the penalty at 100 percent by default', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-06-10T00:00:00.000Z'),
        percentPerDay: 20,
        maxPercent: null,
      }),
    ).toBe(100);
  });

  it('returns 0 when percentPerDay is 0', () => {
    expect(
      computeLatePenaltyPercent({
        dueAt,
        submittedAt: new Date('2026-05-15T00:00:00.000Z'),
        percentPerDay: 0,
        maxPercent: null,
      }),
    ).toBe(0);
  });
});

describe('applyLatePenalty', () => {
  it('returns the original score when penalty is 0', () => {
    expect(applyLatePenalty({ score: 8.5, penaltyPercent: 0 })).toBe(8.5);
  });

  it('returns 0 when penalty is 100', () => {
    expect(applyLatePenalty({ score: 8.5, penaltyPercent: 100 })).toBe(0);
  });

  it('applies a 10 percent deduction', () => {
    expect(applyLatePenalty({ score: 10, penaltyPercent: 10 })).toBeCloseTo(9, 10);
  });

  it('clamps the adjusted score at zero', () => {
    expect(applyLatePenalty({ score: 10, penaltyPercent: 150 })).toBe(0);
  });

  it('clamps negative penalty values to zero (treated as no penalty)', () => {
    expect(applyLatePenalty({ score: 10, penaltyPercent: -5 })).toBe(10);
  });
});
