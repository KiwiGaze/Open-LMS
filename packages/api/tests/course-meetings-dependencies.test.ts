import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseMeeting: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCourseMeetingsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseMeeting: coreMocks.createCourseMeeting,
    createDbHandle: coreMocks.createDbHandle,
    listCourseMeetingsForCourse: coreMocks.listCourseMeetingsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const meetingId = '01J9QW7B6N5W2YH3D3A1V0KE92';
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
  constraint_name: 'course_meeting_tenant_course_fk',
});

const sampleMeeting = () => ({
  id: meetingId,
  tenantId,
  courseId,
  title: 'Live workshop',
  description: 'Synchronous workshop on rubrics and feedback.',
  provider: 'zoom',
  externalUrl: 'https://example.zoom.us/j/123456789',
  startsAt,
  endsAt,
  recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
  playbackUrl: 'https://media.example.edu/playback/workshop',
  status: 'scheduled',
  createdAt: now,
  updatedAt: now,
});

describe('course meeting API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseMeetingsForCourse.mockResolvedValue([sampleMeeting()]);
    coreMocks.createCourseMeeting.mockResolvedValue(sampleMeeting());
    configureCourseAccess('student', 'student');
  });

  it('lists meetings for any course member', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseMeetings(actorUserId, tenantId, courseId),
    ).resolves.toMatchObject([{ id: meetingId, provider: 'zoom' }]);

    expect(coreMocks.listCourseMeetingsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('rejects users outside the course listing meetings', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseMeetings(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listCourseMeetingsForCourse).not.toHaveBeenCalled();
  });

  it('creates meetings for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMeeting(actorUserId, tenantId, courseId, {
        title: 'Live workshop',
        description: 'Synchronous workshop on rubrics and feedback.',
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt,
        endsAt,
        recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
        playbackUrl: 'https://media.example.edu/playback/workshop',
        status: 'scheduled',
      }),
    ).resolves.toMatchObject({ id: meetingId, status: 'scheduled' });

    expect(coreMocks.createCourseMeeting).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Live workshop',
      description: 'Synchronous workshop on rubrics and feedback.',
      provider: 'zoom',
      externalUrl: 'https://example.zoom.us/j/123456789',
      startsAt,
      endsAt,
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
      status: 'scheduled',
    });
  });

  it('allows tenant staff without course membership to create meetings', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseMeeting(actorUserId, tenantId, courseId, {
      title: 'Office hours',
      description: null,
      provider: 'bbb',
      externalUrl: 'https://example.bbb.org/room/abc',
      startsAt,
      endsAt: null,
      recordingUrl: null,
      playbackUrl: null,
      status: 'scheduled',
    });

    expect(coreMocks.createCourseMeeting).toHaveBeenCalledTimes(1);
  });

  it('rejects students creating meetings', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMeeting(actorUserId, tenantId, courseId, {
        title: 'Live workshop',
        description: null,
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt,
        endsAt: null,
        recordingUrl: null,
        playbackUrl: null,
        status: 'scheduled',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create meetings. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseMeeting).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseMeeting.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMeeting(actorUserId, tenantId, courseId, {
        title: 'Live workshop',
        description: null,
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt,
        endsAt: null,
        recordingUrl: null,
        playbackUrl: null,
        status: 'scheduled',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
