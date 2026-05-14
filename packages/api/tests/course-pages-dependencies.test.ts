import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCoursePage: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCoursePagesForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCoursePage: coreMocks.createCoursePage,
    createDbHandle: coreMocks.createDbHandle,
    listCoursePagesForCourse: coreMocks.listCoursePagesForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const pageId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE88';
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

const missingCoursePageCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_page_tenant_course_fk',
});

describe('course page API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCoursePagesForCourse.mockResolvedValue([]);
    coreMocks.createCoursePage.mockResolvedValue({
      id: pageId,
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates course pages for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCoursePage(actorUserId, tenantId, courseId, {
        title: 'Evidence page',
        body: 'Evidence needs reasoning that connects it to a claim.',
        visibility: 'published',
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).resolves.toMatchObject({
      id: pageId,
      courseId,
      title: 'Evidence page',
      version: 1,
    });

    expect(coreMocks.createCoursePage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('allows tenant staff without course membership to create course pages', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCoursePage(actorUserId, tenantId, courseId, {
      title: 'Draft policy page',
      body: 'Review this before publishing.',
      visibility: 'draft',
      learningObjectiveIds: [],
    });

    expect(coreMocks.createCoursePage).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Draft policy page',
      body: 'Review this before publishing.',
      visibility: 'draft',
      learningObjectiveIds: [],
    });
  });

  it('rejects students creating course pages', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCoursePage(actorUserId, tenantId, courseId, {
        title: 'Evidence page',
        body: 'Evidence needs reasoning that connects it to a claim.',
        visibility: 'published',
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course pages. Ask an instructor for access.',
    });

    expect(coreMocks.createCoursePage).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCoursePage.mockRejectedValue(missingCoursePageCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCoursePage(actorUserId, tenantId, courseId, {
        title: 'Evidence page',
        body: 'Evidence needs reasoning that connects it to a claim.',
        visibility: 'published',
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
