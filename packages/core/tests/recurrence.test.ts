import { describe, expect, it } from 'vitest';
import {
  InvalidRecurrenceRuleError,
  expandRecurrence,
  parseRecurrenceRule,
} from '../src/calendar/recurrence.ts';

describe('parseRecurrenceRule', () => {
  it('parses FREQ=DAILY with default interval', () => {
    expect(parseRecurrenceRule('FREQ=DAILY')).toEqual({
      freq: 'DAILY',
      interval: 1,
      until: null,
      count: null,
      byDay: null,
    });
  });

  it('parses FREQ=WEEKLY with BYDAY and INTERVAL', () => {
    const result = parseRecurrenceRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR');
    expect(result).toMatchObject({
      freq: 'WEEKLY',
      interval: 2,
      byDay: ['MO', 'WE', 'FR'],
    });
  });

  it('parses UNTIL terminator', () => {
    const result = parseRecurrenceRule('FREQ=DAILY;UNTIL=2026-12-31T00:00:00.000Z');
    expect(result.until?.toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });

  it('parses FREQ=MONTHLY', () => {
    expect(parseRecurrenceRule('FREQ=MONTHLY')).toMatchObject({ freq: 'MONTHLY' });
  });

  it('parses FREQ=YEARLY', () => {
    expect(parseRecurrenceRule('FREQ=YEARLY')).toMatchObject({ freq: 'YEARLY' });
  });

  it('rejects unsupported FREQ', () => {
    expect(() => parseRecurrenceRule('FREQ=HOURLY')).toThrow(InvalidRecurrenceRuleError);
  });

  it('rejects BYDAY with FREQ=DAILY', () => {
    expect(() => parseRecurrenceRule('FREQ=DAILY;BYDAY=MO')).toThrow(InvalidRecurrenceRuleError);
  });

  it('rejects both UNTIL and COUNT', () => {
    expect(() => parseRecurrenceRule('FREQ=DAILY;UNTIL=2026-12-31T00:00:00.000Z;COUNT=5')).toThrow(
      InvalidRecurrenceRuleError,
    );
  });
});

describe('expandRecurrence', () => {
  const baseStartsAt = new Date('2026-05-04T09:00:00.000Z'); // Monday
  const baseEndsAt = new Date('2026-05-04T10:00:00.000Z');

  it('returns base event when recurrenceRule is null and window overlaps', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: null,
      windowStart: new Date('2026-05-01T00:00:00.000Z'),
      windowEnd: new Date('2026-05-31T00:00:00.000Z'),
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.startsAt.toISOString()).toBe(baseStartsAt.toISOString());
    expect(result[0]?.endsAt?.toISOString()).toBe(baseEndsAt.toISOString());
  });

  it('returns no occurrences when null rule falls outside window', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: null,
      windowStart: new Date('2026-06-01T00:00:00.000Z'),
      windowEnd: new Date('2026-06-30T00:00:00.000Z'),
    });
    expect(result).toHaveLength(0);
  });

  it('expands FREQ=DAILY within window', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: 'FREQ=DAILY',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2026-05-07T23:59:59.000Z'),
    });
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-05-04T09:00:00.000Z',
      '2026-05-05T09:00:00.000Z',
      '2026-05-06T09:00:00.000Z',
      '2026-05-07T09:00:00.000Z',
    ]);
  });

  it('respects COUNT terminator', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: 'FREQ=DAILY;COUNT=3',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2026-05-31T00:00:00.000Z'),
    });
    expect(result).toHaveLength(3);
  });

  it('respects UNTIL terminator', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: 'FREQ=DAILY;UNTIL=2026-05-06T00:00:00.000Z',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2026-05-31T00:00:00.000Z'),
    });
    // 2026-05-04 09:00 and 2026-05-05 09:00 — both are before UNTIL boundary
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-05-04T09:00:00.000Z',
      '2026-05-05T09:00:00.000Z',
    ]);
  });

  it('expands FREQ=WEEKLY;BYDAY=MO,WE,FR', () => {
    const result = expandRecurrence({
      baseStartsAt, // Monday 2026-05-04
      baseEndsAt,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2026-05-17T23:59:59.000Z'),
    });
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-05-04T09:00:00.000Z', // Mon
      '2026-05-06T09:00:00.000Z', // Wed
      '2026-05-08T09:00:00.000Z', // Fri
      '2026-05-11T09:00:00.000Z', // Mon
      '2026-05-13T09:00:00.000Z', // Wed
      '2026-05-15T09:00:00.000Z', // Fri
    ]);
  });

  it('expands WEEKLY with INTERVAL=2 (biweekly)', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2026-06-15T00:00:00.000Z'),
    });
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-05-04T09:00:00.000Z',
      '2026-05-18T09:00:00.000Z',
      '2026-06-01T09:00:00.000Z',
    ]);
  });

  it('caps occurrences by maxOccurrences', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: 'FREQ=DAILY',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2027-05-04T00:00:00.000Z'),
      maxOccurrences: 5,
    });
    expect(result).toHaveLength(5);
  });

  it('expands FREQ=MONTHLY preserving day-of-month', () => {
    const result = expandRecurrence({
      baseStartsAt: new Date('2026-01-15T10:00:00.000Z'),
      baseEndsAt: new Date('2026-01-15T11:00:00.000Z'),
      recurrenceRule: 'FREQ=MONTHLY',
      windowStart: new Date('2026-01-01T00:00:00.000Z'),
      windowEnd: new Date('2026-05-01T00:00:00.000Z'),
    });
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-01-15T10:00:00.000Z',
      '2026-02-15T10:00:00.000Z',
      '2026-03-15T10:00:00.000Z',
      '2026-04-15T10:00:00.000Z',
    ]);
  });

  it('skips impossible dates (Feb 30) without breaking COUNT', () => {
    const result = expandRecurrence({
      baseStartsAt: new Date('2026-01-30T09:00:00.000Z'),
      baseEndsAt: null,
      recurrenceRule: 'FREQ=MONTHLY;COUNT=4',
      windowStart: new Date('2026-01-01T00:00:00.000Z'),
      windowEnd: new Date('2026-12-31T00:00:00.000Z'),
    });
    // Feb has no 30th — skipped. We collect Jan 30, Mar 30, Apr 30, May 30.
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-01-30T09:00:00.000Z',
      '2026-03-30T09:00:00.000Z',
      '2026-04-30T09:00:00.000Z',
      '2026-05-30T09:00:00.000Z',
    ]);
  });

  it('expands FREQ=MONTHLY;INTERVAL=3 (quarterly)', () => {
    const result = expandRecurrence({
      baseStartsAt: new Date('2026-01-15T10:00:00.000Z'),
      baseEndsAt: null,
      recurrenceRule: 'FREQ=MONTHLY;INTERVAL=3',
      windowStart: new Date('2026-01-01T00:00:00.000Z'),
      windowEnd: new Date('2026-12-31T00:00:00.000Z'),
    });
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-01-15T10:00:00.000Z',
      '2026-04-15T10:00:00.000Z',
      '2026-07-15T10:00:00.000Z',
      '2026-10-15T10:00:00.000Z',
    ]);
  });

  it('expands FREQ=YEARLY preserving month and day', () => {
    const result = expandRecurrence({
      baseStartsAt: new Date('2026-09-01T08:00:00.000Z'),
      baseEndsAt: null,
      recurrenceRule: 'FREQ=YEARLY;COUNT=3',
      windowStart: new Date('2026-01-01T00:00:00.000Z'),
      windowEnd: new Date('2030-01-01T00:00:00.000Z'),
    });
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2026-09-01T08:00:00.000Z',
      '2027-09-01T08:00:00.000Z',
      '2028-09-01T08:00:00.000Z',
    ]);
  });

  it('skips Feb 29 in non-leap years for FREQ=YEARLY', () => {
    const result = expandRecurrence({
      baseStartsAt: new Date('2028-02-29T10:00:00.000Z'), // 2028 is a leap year
      baseEndsAt: null,
      recurrenceRule: 'FREQ=YEARLY;COUNT=2',
      windowStart: new Date('2028-01-01T00:00:00.000Z'),
      windowEnd: new Date('2035-01-01T00:00:00.000Z'),
    });
    // Next Feb 29 is 2032 (2029, 2030, 2031 are not leap years).
    expect(result.map((o) => o.startsAt.toISOString())).toEqual([
      '2028-02-29T10:00:00.000Z',
      '2032-02-29T10:00:00.000Z',
    ]);
  });

  it('returns empty list when windowEnd before windowStart', () => {
    const result = expandRecurrence({
      baseStartsAt,
      baseEndsAt,
      recurrenceRule: 'FREQ=DAILY',
      windowStart: new Date('2026-05-04T00:00:00.000Z'),
      windowEnd: new Date('2026-05-03T00:00:00.000Z'),
    });
    expect(result).toHaveLength(0);
  });
});
