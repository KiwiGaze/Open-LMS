import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCoursePage: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCoursePage: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCoursePage: coreMocks.deleteCoursePage,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCoursePage: coreMocks.updateCoursePage,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const coursePageId = '01J9QW7B6N5W2YH3D3A1V0KE96';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE97';
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

const samplePage = () => ({
  id: coursePageId,
  tenantId,
  courseId,
  title: 'Evidence and reasoning (updated)',
  body: 'Updated content.',
  visibility: 'published',
  version: 2,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

describe('course page update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCoursePage.mockResolvedValue(samplePage());
    coreMocks.deleteCoursePage.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a course page for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCoursePage(actorUserId, tenantId, courseId, coursePageId, {
        title: 'Evidence and reasoning (updated)',
        body: 'Updated content.',
        visibility: 'published',
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).resolves.toMatchObject({ id: coursePageId, version: 2 });

    expect(coreMocks.updateCoursePage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      coursePageId,
      title: 'Evidence and reasoning (updated)',
      body: 'Updated content.',
      visibility: 'published',
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('returns not found when updating a missing course page', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCoursePage.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCoursePage(actorUserId, tenantId, courseId, coursePageId, {
        title: 'Title',
        body: 'Body',
        visibility: 'published',
        learningObjectiveIds: [],
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course page was not found. Check the page id and retry the request.',
    });
  });

  it('rejects students from updating course pages', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCoursePage(actorUserId, tenantId, courseId, coursePageId, {
        title: 'Title',
        body: 'Body',
        visibility: 'published',
        learningObjectiveIds: [],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCoursePage).not.toHaveBeenCalled();
  });

  it('deletes a course page for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCoursePage(actorUserId, tenantId, courseId, coursePageId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCoursePage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      coursePageId,
    });
  });

  it('returns not found when deleting a missing course page', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCoursePage.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCoursePage(actorUserId, tenantId, courseId, coursePageId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course page was not found. Check the page id and retry the request.',
    });
  });

  it('rejects students from deleting course pages', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCoursePage(actorUserId, tenantId, courseId, coursePageId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCoursePage).not.toHaveBeenCalled();
  });
});
