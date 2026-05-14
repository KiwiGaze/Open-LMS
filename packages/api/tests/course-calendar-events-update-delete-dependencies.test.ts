import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseCalendarEvent: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseCalendarEvent: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseCalendarEvent: coreMocks.deleteCourseCalendarEvent,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseCalendarEvent: coreMocks.updateCourseCalendarEvent,
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

const sampleEvent = () => ({
  id: eventId,
  tenantId,
  courseId,
  title: 'Weekly workshop (refreshed)',
  description: null,
  location: 'Room 204',
  startsAt,
  endsAt,
  visibility: 'published',
  recurrenceRule: null,
  createdAt: now,
  updatedAt: now,
});

describe('course calendar event update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseCalendarEvent.mockResolvedValue(sampleEvent());
    coreMocks.deleteCourseCalendarEvent.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a calendar event for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCalendarEvent(actorUserId, tenantId, courseId, eventId, {
        title: 'Weekly workshop (refreshed)',
        description: null,
        location: 'Room 204',
        startsAt,
        endsAt,
        visibility: 'published',
        recurrenceRule: null,
      }),
    ).resolves.toMatchObject({ id: eventId, title: 'Weekly workshop (refreshed)' });

    expect(coreMocks.updateCourseCalendarEvent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      eventId,
      title: 'Weekly workshop (refreshed)',
      description: null,
      location: 'Room 204',
      startsAt,
      endsAt,
      visibility: 'published',
      recurrenceRule: null,
    });
  });

  it('returns not found when updating a missing event', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseCalendarEvent.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCalendarEvent(actorUserId, tenantId, courseId, eventId, {
        title: 'Weekly workshop',
        description: null,
        location: null,
        startsAt,
        endsAt,
        visibility: 'published',
        recurrenceRule: null,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Calendar event was not found in this course. Check the event id and retry the request.',
    });
  });

  it('rejects students from updating calendar events', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCalendarEvent(actorUserId, tenantId, courseId, eventId, {
        title: 'Weekly workshop',
        description: null,
        location: null,
        startsAt,
        endsAt,
        visibility: 'published',
        recurrenceRule: null,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseCalendarEvent).not.toHaveBeenCalled();
  });

  it('deletes a calendar event for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseCalendarEvent(actorUserId, tenantId, courseId, eventId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseCalendarEvent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      eventId,
    });
  });

  it('returns not found when deleting a missing event', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseCalendarEvent.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseCalendarEvent(actorUserId, tenantId, courseId, eventId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Calendar event was not found in this course. Check the event id and retry the request.',
    });
  });

  it('rejects students from deleting calendar events', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseCalendarEvent(actorUserId, tenantId, courseId, eventId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseCalendarEvent).not.toHaveBeenCalled();
  });
});
