import { CalendarItem, type CalendarItem as CalendarItemContract } from '@openlms/contracts';

const CRLF = '\r\n';

// Escapes RFC 5545 TEXT values: backslashes, semicolons, commas, and newlines.
const escapeIcsText = (value: string): string =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n');

const formatUtcStamp = (date: Date): string =>
  `${date.getUTCFullYear().toString().padStart(4, '0')}${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}${date.getUTCDate().toString().padStart(2, '0')}T${date
    .getUTCHours()
    .toString()
    .padStart(2, '0')}${date.getUTCMinutes().toString().padStart(2, '0')}${date
    .getUTCSeconds()
    .toString()
    .padStart(2, '0')}Z`;

// Serializes calendar items as an RFC 5545 VCALENDAR feed. Callers serve the
// returned string as text/calendar so subscribers can import it into their
// calendar apps.
export const serializeCalendarItemsAsIcs = (
  items: CalendarItemContract[],
  now: Date = new Date(),
): string => {
  const dtstamp = formatUtcStamp(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open LMS//Calendar//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const raw of items) {
    const item = CalendarItem.parse(raw);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${item.id}@open-lms`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatUtcStamp(item.startsAt)}`);
    if (item.endsAt) {
      lines.push(`DTEND:${formatUtcStamp(item.endsAt)}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(`${item.courseCode} — ${item.title}`)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(item.courseTitle)}`);
    lines.push(`CATEGORIES:${escapeIcsText(item.itemType)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `${lines.join(CRLF)}${CRLF}`;
};
