import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: { transaction: vi.fn() } },
  deleteCourseAnnouncement: vi.fn(),
  getCourseAnnouncementForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveOutboxEvent: vi.fn(),
  updateCourseAnnouncement: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseAnnouncement: coreMocks.deleteCourseAnnouncement,
    getCourseAnnouncementForCourse: coreMocks.getCourseAnnouncementForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
    updateCourseAnnouncement: coreMocks.updateCourseAnnouncement,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const announcementId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleAnnouncement = () => ({
  id: announcementId,
  tenantId,
  courseId,
  authorId: actorUserId,
  title: 'Essay workshop reminder',
  body: 'Updated body with new reminders.',
  status: 'published',
  pinned: true,
  postedAt: now,
  createdAt: now,
  updatedAt: now,
});

describe('course announcement update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.dbHandle.db.transaction.mockImplementation(async (callback) =>
      callback(coreMocks.dbHandle.db),
    );
    coreMocks.getCourseAnnouncementForCourse.mockResolvedValue(sampleAnnouncement());
    coreMocks.updateCourseAnnouncement.mockResolvedValue(sampleAnnouncement());
    coreMocks.deleteCourseAnnouncement.mockResolvedValue(true);
    coreMocks.saveOutboxEvent.mockImplementation(async (_db, event) => event);
    configureCourseAccess('student', 'student');
  });

  it('updates an announcement for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseAnnouncement(actorUserId, tenantId, courseId, announcementId, {
        title: 'Essay workshop reminder',
        body: 'Updated body with new reminders.',
        status: 'published',
        pinned: true,
      }),
    ).resolves.toMatchObject({ id: announcementId, body: 'Updated body with new reminders.' });

    expect(coreMocks.updateCourseAnnouncement).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      announcementId,
      title: 'Essay workshop reminder',
      body: 'Updated body with new reminders.',
      status: 'published',
      pinned: true,
    });
    expect(coreMocks.saveOutboxEvent).not.toHaveBeenCalled();
  });

  it('emits an announcement published event when a draft is published', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getCourseAnnouncementForCourse.mockResolvedValue({
      ...sampleAnnouncement(),
      status: 'draft',
      postedAt: null,
    });
    const dependencies = createDependencies();

    await dependencies.updateCourseAnnouncement(actorUserId, tenantId, courseId, announcementId, {
      title: 'Essay workshop reminder',
      body: 'Updated body with new reminders.',
      status: 'published',
      pinned: true,
    });

    expect(coreMocks.saveOutboxEvent).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        topic: 'announcement.lifecycle',
        eventType: 'announcement.published',
        payload: {
          courseId,
          announcementId,
          authorId: actorUserId,
          title: 'Essay workshop reminder',
        },
      }),
    );
  });

  it('returns not found when updating a missing announcement', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseAnnouncement.mockResolvedValue(null);
    coreMocks.getCourseAnnouncementForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseAnnouncement(actorUserId, tenantId, courseId, announcementId, {
        title: 'Essay workshop reminder',
        body: 'Updated.',
        status: 'published',
        pinned: false,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Announcement was not found in this course. Check the announcement id and retry the request.',
    });
  });

  it('rejects students from updating announcements', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseAnnouncement(actorUserId, tenantId, courseId, announcementId, {
        title: 'Essay workshop reminder',
        body: 'Updated.',
        status: 'published',
        pinned: false,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseAnnouncement).not.toHaveBeenCalled();
  });

  it('deletes an announcement for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseAnnouncement(actorUserId, tenantId, courseId, announcementId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseAnnouncement).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      announcementId,
    });
  });

  it('returns not found when deleting a missing announcement', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseAnnouncement.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseAnnouncement(actorUserId, tenantId, courseId, announcementId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Announcement was not found in this course. Check the announcement id and retry the request.',
    });
  });

  it('rejects students from deleting announcements', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseAnnouncement(actorUserId, tenantId, courseId, announcementId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseAnnouncement).not.toHaveBeenCalled();
  });
});
