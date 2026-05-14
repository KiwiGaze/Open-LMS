// Minimal RFC 5545 RRULE subset for course calendar events.
// Supports: FREQ=DAILY|WEEKLY|MONTHLY|YEARLY, INTERVAL=N, UNTIL=ISO8601, COUNT=N,
// BYDAY=MO,TU,WE,... (WEEKLY only).
// MONTHLY/YEARLY preserve the base day-of-month / month+day. Impossible dates (Feb 30,
// Feb 29 in non-leap years) are skipped without counting against COUNT.
// Anything else in the rule is rejected with InvalidRecurrenceRuleError.

export class InvalidRecurrenceRuleError extends Error {
  override readonly name = 'InvalidRecurrenceRuleError';
}

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurrenceWeekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

const weekdaysInOrder: readonly RecurrenceWeekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const weekdayIndex: Record<RecurrenceWeekday, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 0,
};

export type ParsedRecurrenceRule = {
  freq: RecurrenceFrequency;
  interval: number;
  until: Date | null;
  count: number | null;
  byDay: readonly RecurrenceWeekday[] | null;
};

export const parseRecurrenceRule = (rule: string): ParsedRecurrenceRule => {
  const tokens = rule
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (tokens.length === 0) {
    throw new InvalidRecurrenceRuleError('Recurrence rule must include at least FREQ.');
  }

  let freq: RecurrenceFrequency | null = null;
  let interval = 1;
  let until: Date | null = null;
  let count: number | null = null;
  let byDay: RecurrenceWeekday[] | null = null;

  for (const token of tokens) {
    const eq = token.indexOf('=');
    if (eq <= 0) {
      throw new InvalidRecurrenceRuleError(`Invalid recurrence token: ${token}`);
    }
    const key = token.slice(0, eq).toUpperCase();
    const value = token.slice(eq + 1);

    switch (key) {
      case 'FREQ': {
        if (value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY' || value === 'YEARLY') {
          freq = value;
        } else {
          throw new InvalidRecurrenceRuleError(`Unsupported FREQ: ${value}`);
        }
        break;
      }
      case 'INTERVAL': {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 366) {
          throw new InvalidRecurrenceRuleError(`Invalid INTERVAL: ${value}`);
        }
        interval = parsed;
        break;
      }
      case 'UNTIL': {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          throw new InvalidRecurrenceRuleError(`Invalid UNTIL: ${value}`);
        }
        until = parsed;
        break;
      }
      case 'COUNT': {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10_000) {
          throw new InvalidRecurrenceRuleError(`Invalid COUNT: ${value}`);
        }
        count = parsed;
        break;
      }
      case 'BYDAY': {
        const parts = value.split(',').map((part) => part.trim().toUpperCase());
        for (const part of parts) {
          if (!weekdaysInOrder.includes(part as RecurrenceWeekday)) {
            throw new InvalidRecurrenceRuleError(`Invalid BYDAY entry: ${part}`);
          }
        }
        byDay = parts as RecurrenceWeekday[];
        break;
      }
      default:
        throw new InvalidRecurrenceRuleError(`Unsupported recurrence directive: ${key}`);
    }
  }

  if (freq === null) {
    throw new InvalidRecurrenceRuleError('Recurrence rule must include FREQ.');
  }

  if (until !== null && count !== null) {
    throw new InvalidRecurrenceRuleError('Recurrence rule cannot specify both UNTIL and COUNT.');
  }

  if (byDay && freq !== 'WEEKLY') {
    throw new InvalidRecurrenceRuleError('BYDAY is only supported with FREQ=WEEKLY.');
  }

  return { freq, interval, until, count, byDay };
};

export type RecurrenceOccurrence = {
  startsAt: Date;
  endsAt: Date | null;
};

export type ExpandRecurrenceInput = {
  baseStartsAt: Date;
  baseEndsAt: Date | null;
  recurrenceRule: string | null;
  windowStart: Date;
  windowEnd: Date;
  maxOccurrences?: number;
};

const DEFAULT_MAX_OCCURRENCES = 500;

const advanceDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const overlapsWindow = (
  occurrenceStart: Date,
  occurrenceEnd: Date | null,
  windowStart: Date,
  windowEnd: Date,
): boolean => {
  const start = occurrenceStart.getTime();
  const end = occurrenceEnd ? occurrenceEnd.getTime() : start;

  return end >= windowStart.getTime() && start <= windowEnd.getTime();
};

const isSameOrAfterDay = (a: Date, b: Date): boolean => {
  return a.getTime() >= b.getTime();
};

export const expandRecurrence = (input: ExpandRecurrenceInput): RecurrenceOccurrence[] => {
  if (input.windowEnd.getTime() < input.windowStart.getTime()) {
    return [];
  }

  const max = input.maxOccurrences ?? DEFAULT_MAX_OCCURRENCES;
  const occurrences: RecurrenceOccurrence[] = [];

  const durationMs = input.baseEndsAt
    ? input.baseEndsAt.getTime() - input.baseStartsAt.getTime()
    : null;

  const makeOccurrence = (start: Date): RecurrenceOccurrence => ({
    startsAt: start,
    endsAt: durationMs === null ? null : new Date(start.getTime() + durationMs),
  });

  if (input.recurrenceRule === null) {
    const base = makeOccurrence(input.baseStartsAt);
    if (overlapsWindow(base.startsAt, base.endsAt, input.windowStart, input.windowEnd)) {
      occurrences.push(base);
    }
    return occurrences;
  }

  const parsed = parseRecurrenceRule(input.recurrenceRule);

  const terminator = parsed.until ?? input.windowEnd;
  let emitted = 0;
  let iterations = 0;
  const safetyLimit = 100_000;

  if (parsed.freq === 'DAILY') {
    let cursor = new Date(input.baseStartsAt);
    while (
      cursor.getTime() <= terminator.getTime() &&
      emitted < (parsed.count ?? Number.POSITIVE_INFINITY)
    ) {
      if (iterations++ > safetyLimit) {
        break;
      }
      const occurrence = makeOccurrence(cursor);
      if (cursor.getTime() > input.windowEnd.getTime()) {
        break;
      }
      if (
        overlapsWindow(occurrence.startsAt, occurrence.endsAt, input.windowStart, input.windowEnd)
      ) {
        occurrences.push(occurrence);
        if (occurrences.length >= max) {
          break;
        }
      }
      emitted += 1;
      cursor = advanceDays(cursor, parsed.interval);
    }
    return occurrences;
  }

  if (parsed.freq === 'WEEKLY') {
    const byDay =
      parsed.byDay && parsed.byDay.length > 0
        ? parsed.byDay.map((d) => weekdayIndex[d])
        : [input.baseStartsAt.getUTCDay()];
    const byDaySet = new Set(byDay);

    // Anchor week to the Monday on/before baseStartsAt (UTC).
    const baseDay = input.baseStartsAt.getUTCDay();
    const daysSinceMonday = baseDay === 0 ? 6 : baseDay - 1;
    const weekAnchor = advanceDays(input.baseStartsAt, -daysSinceMonday);
    weekAnchor.setUTCHours(
      input.baseStartsAt.getUTCHours(),
      input.baseStartsAt.getUTCMinutes(),
      input.baseStartsAt.getUTCSeconds(),
      input.baseStartsAt.getUTCMilliseconds(),
    );

    let weekCursor = weekAnchor;
    while (
      weekCursor.getTime() <= terminator.getTime() &&
      emitted < (parsed.count ?? Number.POSITIVE_INFINITY) &&
      iterations++ <= safetyLimit
    ) {
      for (let i = 0; i < 7; i++) {
        const dayCursor = advanceDays(weekCursor, i);
        const dayOfWeek = dayCursor.getUTCDay();
        if (!byDaySet.has(dayOfWeek)) {
          continue;
        }
        if (!isSameOrAfterDay(dayCursor, input.baseStartsAt)) {
          continue;
        }
        if (dayCursor.getTime() > terminator.getTime()) {
          break;
        }
        if (emitted >= (parsed.count ?? Number.POSITIVE_INFINITY)) {
          break;
        }
        const occurrence = makeOccurrence(dayCursor);
        if (
          overlapsWindow(occurrence.startsAt, occurrence.endsAt, input.windowStart, input.windowEnd)
        ) {
          occurrences.push(occurrence);
          if (occurrences.length >= max) {
            return occurrences;
          }
        }
        emitted += 1;
      }
      weekCursor = advanceDays(weekCursor, parsed.interval * 7);
      if (weekCursor.getTime() > input.windowEnd.getTime()) {
        break;
      }
    }
    return occurrences;
  }

  // MONTHLY or YEARLY: step by months/years from baseStartsAt, preserving day-of-month
  // (and month for YEARLY). Skip impossible dates without counting against COUNT.
  const stepMonths = parsed.freq === 'MONTHLY' ? parsed.interval : parsed.interval * 12;
  const baseYear = input.baseStartsAt.getUTCFullYear();
  const baseMonth = input.baseStartsAt.getUTCMonth();
  const baseDayOfMonth = input.baseStartsAt.getUTCDate();
  const baseHours = input.baseStartsAt.getUTCHours();
  const baseMinutes = input.baseStartsAt.getUTCMinutes();
  const baseSeconds = input.baseStartsAt.getUTCSeconds();
  const baseMs = input.baseStartsAt.getUTCMilliseconds();

  let stepIndex = 0;
  while (emitted < (parsed.count ?? Number.POSITIVE_INFINITY) && iterations++ <= safetyLimit) {
    const targetMonth = baseMonth + stepMonths * stepIndex;
    const targetYear = baseYear + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const candidate = new Date(
      Date.UTC(
        targetYear,
        normalizedMonth,
        baseDayOfMonth,
        baseHours,
        baseMinutes,
        baseSeconds,
        baseMs,
      ),
    );

    // Skip impossible dates (Date.UTC rolls over, so verify the components round-trip).
    const validDate =
      candidate.getUTCFullYear() === targetYear &&
      candidate.getUTCMonth() === normalizedMonth &&
      candidate.getUTCDate() === baseDayOfMonth;

    stepIndex += 1;

    if (!validDate) {
      if (candidate.getTime() > terminator.getTime()) {
        break;
      }
      continue;
    }

    if (candidate.getTime() > terminator.getTime()) {
      break;
    }
    if (candidate.getTime() > input.windowEnd.getTime()) {
      break;
    }

    const occurrence = makeOccurrence(candidate);
    if (
      overlapsWindow(occurrence.startsAt, occurrence.endsAt, input.windowStart, input.windowEnd)
    ) {
      occurrences.push(occurrence);
      if (occurrences.length >= max) {
        return occurrences;
      }
    }
    emitted += 1;
  }

  return occurrences;
};
