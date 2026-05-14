import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: { transaction: vi.fn() } },
  createCourseAnnouncement: vi.fn(),
  createDbHandle: vi.fn(),
  listCourseAnnouncementsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveOutboxEvent: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseAnnouncement: coreMocks.createCourseAnnouncement,
    createDbHandle: coreMocks.createDbHandle,
    listCourseAnnouncementsForCourse: coreMocks.listCourseAnnouncementsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const announcementId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const now = new Date('2026-05-10T00:00:00.000Z');

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

const missingCourseAnnouncementError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_announcement_tenant_course_fk',
});

const missingCourseIdAnnouncementError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_announcement_course_id_course_id_fk',
});

describe('announcement API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.dbHandle.db.transaction.mockImplementation(async (callback) =>
      callback(coreMocks.dbHandle.db),
    );
    coreMocks.listCourseAnnouncementsForCourse.mockResolvedValue([]);
    coreMocks.createCourseAnnouncement.mockResolvedValue({
      id: announcementId,
      tenantId,
      courseId,
      authorId: actorUserId,
      title: 'Essay workshop reminder',
      body: 'Bring one paragraph and one question for peer review.',
      status: 'published',
      pinned: true,
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.saveOutboxEvent.mockImplementation(async (_db, event) => event);
    configureCourseAccess('student', 'student');
  });

  it('creates announcements for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseAnnouncement(actorUserId, tenantId, courseId, {
        title: 'Essay workshop reminder',
        body: 'Bring one paragraph and one question for peer review.',
        status: 'published',
        pinned: true,
      }),
    ).resolves.toMatchObject({
      id: announcementId,
      authorId: actorUserId,
      status: 'published',
      pinned: true,
      postedAt: now,
    });

    expect(coreMocks.createCourseAnnouncement).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      authorId: actorUserId,
      title: 'Essay workshop reminder',
      body: 'Bring one paragraph and one question for peer review.',
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

  it('allows tenant staff without course membership to create announcements', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseAnnouncement.mockResolvedValueOnce({
      id: announcementId,
      tenantId,
      courseId,
      authorId: actorUserId,
      title: 'Draft weekly note',
      body: 'This one stays in draft until we confirm timings.',
      status: 'draft',
      pinned: false,
      postedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    await dependencies.createCourseAnnouncement(actorUserId, tenantId, courseId, {
      title: 'Draft weekly note',
      body: 'This one stays in draft until we confirm timings.',
      status: 'draft',
      pinned: false,
    });

    expect(coreMocks.createCourseAnnouncement).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      authorId: actorUserId,
      title: 'Draft weekly note',
      body: 'This one stays in draft until we confirm timings.',
      status: 'draft',
      pinned: false,
    });
    expect(coreMocks.saveOutboxEvent).not.toHaveBeenCalled();
  });

  it('rejects students creating announcements', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseAnnouncement(actorUserId, tenantId, courseId, {
        title: 'Essay workshop reminder',
        body: 'Bring one paragraph and one question for peer review.',
        status: 'published',
        pinned: true,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create announcements. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseAnnouncement).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseAnnouncement.mockRejectedValue(missingCourseAnnouncementError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseAnnouncement(actorUserId, tenantId, courseId, {
        title: 'Essay workshop reminder',
        body: 'Bring one paragraph and one question for peer review.',
        status: 'published',
        pinned: true,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps single-column course foreign key failures to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseAnnouncement.mockRejectedValue(missingCourseIdAnnouncementError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseAnnouncement(actorUserId, tenantId, courseId, {
        title: 'Essay workshop reminder',
        body: 'Bring one paragraph and one question for peer review.',
        status: 'published',
        pinned: true,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
