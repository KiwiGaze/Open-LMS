import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCourseCalendarEventsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listCourseCalendarEventsForCourse: coreMocks.listCourseCalendarEventsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const draftEventId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

const publishedWeekly = {
  id: eventId,
  tenantId,
  courseId,
  title: 'Weekly workshop',
  description: null,
  location: null,
  startsAt: new Date('2026-05-04T15:00:00.000Z'), // Monday
  endsAt: new Date('2026-05-04T16:00:00.000Z'),
  visibility: 'published' as const,
  recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE',
  createdAt: now,
  updatedAt: now,
};

const draftSingle = {
  id: draftEventId,
  tenantId,
  courseId,
  title: 'Office hours (draft)',
  description: null,
  location: null,
  startsAt: new Date('2026-05-06T20:00:00.000Z'),
  endsAt: new Date('2026-05-06T21:00:00.000Z'),
  visibility: 'draft' as const,
  recurrenceRule: null,
  createdAt: now,
  updatedAt: now,
};

describe('course calendar event occurrences API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseCalendarEventsForCourse.mockResolvedValue([publishedWeekly, draftSingle]);
    configureCourseAccess('student', 'student');
  });

  it('expands weekly occurrences and includes only published events for learners', async () => {
    const dependencies = createDependencies();

    const occurrences = await dependencies.listCourseCalendarEventOccurrences(
      actorUserId,
      tenantId,
      courseId,
      {
        windowStart: new Date('2026-05-04T00:00:00.000Z'),
        windowEnd: new Date('2026-05-15T23:59:59.000Z'),
      },
    );

    expect(occurrences.map((o) => o.occurrenceStartsAt.toISOString())).toEqual([
      '2026-05-04T15:00:00.000Z', // Mon
      '2026-05-06T15:00:00.000Z', // Wed
      '2026-05-11T15:00:00.000Z', // Mon
      '2026-05-13T15:00:00.000Z', // Wed
    ]);

    // Draft event should not appear for students.
    expect(occurrences.find((o) => o.eventId === draftEventId)).toBeUndefined();
  });

  it('includes draft events when actor is course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const occurrences = await dependencies.listCourseCalendarEventOccurrences(
      actorUserId,
      tenantId,
      courseId,
      {
        windowStart: new Date('2026-05-04T00:00:00.000Z'),
        windowEnd: new Date('2026-05-08T23:59:59.000Z'),
      },
    );

    expect(occurrences.find((o) => o.eventId === draftEventId)).toBeDefined();
  });

  it('rejects invalid recurrence rules with bad_request', async () => {
    coreMocks.listCourseCalendarEventsForCourse.mockResolvedValue([
      { ...publishedWeekly, recurrenceRule: 'FREQ=HOURLY' },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseCalendarEventOccurrences(actorUserId, tenantId, courseId, {
        windowStart: new Date('2026-05-04T00:00:00.000Z'),
        windowEnd: new Date('2026-05-15T23:59:59.000Z'),
      }),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('sorts occurrences chronologically across events', async () => {
    const earlierEvent = {
      ...publishedWeekly,
      id: '01J9QW7B6N5W2YH3D3A1V0KE89',
      title: 'Earlier event',
      startsAt: new Date('2026-05-05T09:00:00.000Z'),
      endsAt: new Date('2026-05-05T10:00:00.000Z'),
      recurrenceRule: null,
    };
    coreMocks.listCourseCalendarEventsForCourse.mockResolvedValue([publishedWeekly, earlierEvent]);
    const dependencies = createDependencies();

    const occurrences = await dependencies.listCourseCalendarEventOccurrences(
      actorUserId,
      tenantId,
      courseId,
      {
        windowStart: new Date('2026-05-04T00:00:00.000Z'),
        windowEnd: new Date('2026-05-08T00:00:00.000Z'),
      },
    );

    const isoTimes = occurrences.map((o) => o.occurrenceStartsAt.toISOString());
    expect(isoTimes).toEqual([...isoTimes].sort());
  });
});
