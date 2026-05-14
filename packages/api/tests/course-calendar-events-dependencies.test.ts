import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseCalendarEvent: vi.fn(),
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
    createCourseCalendarEvent: coreMocks.createCourseCalendarEvent,
    createDbHandle: coreMocks.createDbHandle,
    listCourseCalendarEventsForCourse: coreMocks.listCourseCalendarEventsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const startsAt = new Date('2026-09-10T15:00:00.000Z');
const endsAt = new Date('2026-09-10T16:30:00.000Z');
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

const missingCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_calendar_event_tenant_course_fk',
});

const sampleEvent = () => ({
  id: eventId,
  tenantId,
  courseId,
  title: 'Weekly workshop',
  description: 'Live writing studio for evidence and reasoning.',
  location: 'Room 204',
  startsAt,
  endsAt,
  visibility: 'published',
  recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
  createdAt: now,
  updatedAt: now,
});

describe('course calendar event API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseCalendarEventsForCourse.mockResolvedValue([sampleEvent()]);
    coreMocks.createCourseCalendarEvent.mockResolvedValue(sampleEvent());
    configureCourseAccess('student', 'student');
  });

  it('lists course calendar events for any course member', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseCalendarEvents(actorUserId, tenantId, courseId),
    ).resolves.toMatchObject([{ id: eventId, title: 'Weekly workshop' }]);

    expect(coreMocks.listCourseCalendarEventsForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
      },
    );
  });

  it('rejects users outside the course listing events', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseCalendarEvents(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listCourseCalendarEventsForCourse).not.toHaveBeenCalled();
  });

  it('creates calendar events for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseCalendarEvent(actorUserId, tenantId, courseId, {
        title: 'Weekly workshop',
        description: 'Live writing studio for evidence and reasoning.',
        location: 'Room 204',
        startsAt,
        endsAt,
        visibility: 'published',
        recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
      }),
    ).resolves.toMatchObject({ id: eventId, visibility: 'published' });

    expect(coreMocks.createCourseCalendarEvent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Weekly workshop',
      description: 'Live writing studio for evidence and reasoning.',
      location: 'Room 204',
      startsAt,
      endsAt,
      visibility: 'published',
      recurrenceRule: 'FREQ=WEEKLY;COUNT=10',
    });
  });

  it('allows tenant staff without course membership to create events', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseCalendarEvent(actorUserId, tenantId, courseId, {
      title: 'Office hour',
      description: null,
      location: null,
      startsAt,
      endsAt: null,
      visibility: 'draft',
      recurrenceRule: null,
    });

    expect(coreMocks.createCourseCalendarEvent).toHaveBeenCalledTimes(1);
  });

  it('rejects students creating calendar events', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseCalendarEvent(actorUserId, tenantId, courseId, {
        title: 'Weekly workshop',
        description: null,
        location: null,
        startsAt,
        endsAt,
        visibility: 'draft',
        recurrenceRule: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create calendar events. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseCalendarEvent).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseCalendarEvent.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseCalendarEvent(actorUserId, tenantId, courseId, {
        title: 'Weekly workshop',
        description: null,
        location: null,
        startsAt,
        endsAt,
        visibility: 'draft',
        recurrenceRule: null,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
