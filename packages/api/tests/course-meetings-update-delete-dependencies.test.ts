import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseMeeting: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseMeeting: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseMeeting: coreMocks.deleteCourseMeeting,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseMeeting: coreMocks.updateCourseMeeting,
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

const sampleMeeting = () => ({
  id: meetingId,
  tenantId,
  courseId,
  title: 'Live workshop (rescheduled)',
  description: null,
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

describe('course meeting update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseMeeting.mockResolvedValue(sampleMeeting());
    coreMocks.deleteCourseMeeting.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a meeting for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMeeting(actorUserId, tenantId, courseId, meetingId, {
        title: 'Live workshop (rescheduled)',
        description: null,
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt,
        endsAt,
        recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
        playbackUrl: 'https://media.example.edu/playback/workshop',
        status: 'scheduled',
      }),
    ).resolves.toMatchObject({ id: meetingId, title: 'Live workshop (rescheduled)' });

    expect(coreMocks.updateCourseMeeting).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      meetingId,
      title: 'Live workshop (rescheduled)',
      description: null,
      provider: 'zoom',
      externalUrl: 'https://example.zoom.us/j/123456789',
      startsAt,
      endsAt,
      recordingUrl: 'https://media.example.edu/recordings/workshop.mp4',
      playbackUrl: 'https://media.example.edu/playback/workshop',
      status: 'scheduled',
    });
  });

  it('returns not found when updating a missing meeting', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseMeeting.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMeeting(actorUserId, tenantId, courseId, meetingId, {
        title: 'Live workshop',
        description: null,
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt,
        endsAt,
        recordingUrl: null,
        playbackUrl: null,
        status: 'scheduled',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Meeting was not found in this course. Check the meeting id and retry the request.',
    });
  });

  it('rejects students from updating meetings', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMeeting(actorUserId, tenantId, courseId, meetingId, {
        title: 'Live workshop',
        description: null,
        provider: 'zoom',
        externalUrl: 'https://example.zoom.us/j/123456789',
        startsAt,
        endsAt,
        recordingUrl: null,
        playbackUrl: null,
        status: 'scheduled',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseMeeting).not.toHaveBeenCalled();
  });

  it('deletes a meeting for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseMeeting(actorUserId, tenantId, courseId, meetingId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseMeeting).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      meetingId,
    });
  });

  it('returns not found when deleting a missing meeting', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseMeeting.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseMeeting(actorUserId, tenantId, courseId, meetingId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Meeting was not found in this course. Check the meeting id and retry the request.',
    });
  });

  it('rejects students from deleting meetings', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseMeeting(actorUserId, tenantId, courseId, meetingId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseMeeting).not.toHaveBeenCalled();
  });
});
