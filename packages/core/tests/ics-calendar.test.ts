import { CalendarItem } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { serializeCalendarItemsAsIcs } from '../src/calendar/ics.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEC0';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KEC1';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KEC2';

const sampleItem = (
  overrides: Partial<{
    id: string;
    title: string;
    courseCode: string;
    courseTitle: string;
    startsAt: Date;
    endsAt: Date | null;
  }> = {},
) =>
  CalendarItem.parse({
    id: overrides.id ?? `calendar:assignment:${assignmentId}`,
    tenantId,
    courseId,
    courseCode: overrides.courseCode ?? 'WRIT-101',
    courseTitle: overrides.courseTitle ?? 'Writing 101',
    itemType: 'assignment_due',
    title: overrides.title ?? 'Essay 1',
    startsAt: overrides.startsAt ?? new Date('2026-05-15T23:59:00.000Z'),
    endsAt: overrides.endsAt ?? null,
    sourceType: 'assignment',
    sourceId: assignmentId,
  });

describe('serializeCalendarItemsAsIcs', () => {
  it('wraps events in VCALENDAR with CRLF line endings', () => {
    const ics = serializeCalendarItemsAsIcs([sampleItem()], now);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('VERSION:2.0\r\n');
    expect(ics).toContain('PRODID:-//Open LMS//Calendar//EN\r\n');
  });

  it('emits one VEVENT per item with UID and DTSTART', () => {
    const ics = serializeCalendarItemsAsIcs([sampleItem()], now);

    expect(ics).toContain(`UID:calendar:assignment:${assignmentId}@open-lms\r\n`);
    expect(ics).toContain('DTSTAMP:20260510T000000Z\r\n');
    expect(ics).toContain('DTSTART:20260515T235900Z\r\n');
    expect(ics).toContain('SUMMARY:WRIT-101 — Essay 1\r\n');
    expect(ics).toContain('CATEGORIES:assignment_due\r\n');
  });

  it('emits DTEND only when the item has an end timestamp', () => {
    const without = serializeCalendarItemsAsIcs([sampleItem()], now);
    expect(without).not.toContain('DTEND:');

    const withEnd = serializeCalendarItemsAsIcs(
      [sampleItem({ endsAt: new Date('2026-05-16T00:30:00.000Z') })],
      now,
    );
    expect(withEnd).toContain('DTEND:20260516T003000Z\r\n');
  });

  it('escapes commas, semicolons, backslashes, and newlines in SUMMARY/DESCRIPTION', () => {
    const ics = serializeCalendarItemsAsIcs(
      [
        sampleItem({
          title: 'Essay, draft 1; rev "two"\\path\nnext line',
          courseTitle: 'Writing,\nLiterature',
        }),
      ],
      now,
    );

    expect(ics).toContain(
      'SUMMARY:WRIT-101 — Essay\\, draft 1\\; rev "two"\\\\path\\nnext line\r\n',
    );
    expect(ics).toContain('DESCRIPTION:Writing\\,\\nLiterature\r\n');
  });

  it('returns a header-only calendar when no items are provided', () => {
    const ics = serializeCalendarItemsAsIcs([], now);
    expect(ics).toBe(
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Open LMS//Calendar//EN\r\nCALSCALE:GREGORIAN\r\nEND:VCALENDAR\r\n',
    );
  });

  it('formats DTSTART/DTEND consistently in UTC for any input timezone offset', () => {
    const ics = serializeCalendarItemsAsIcs(
      [
        sampleItem({
          id: 'calendar:assignment:01J9QW7B6N5W2YH3D3A1V0KEC3',
          startsAt: new Date('2026-05-15T03:30:00+07:00'),
        }),
      ],
      now,
    );

    expect(ics).toContain('DTSTART:20260514T203000Z\r\n');
  });
});
