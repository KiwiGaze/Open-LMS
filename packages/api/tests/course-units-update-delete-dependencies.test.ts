import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseUnit: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseUnit: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseUnit: coreMocks.deleteCourseUnit,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseUnit: coreMocks.updateCourseUnit,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const courseUnitId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE89';
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

const sampleUnit = () => ({
  id: courseUnitId,
  tenantId,
  courseId,
  moduleId,
  title: 'Defining a claim (updated)',
  summary: 'Refreshed summary.',
  visibility: 'published',
  accessPolicy: 'course_member',
  version: 2,
  position: 0,
  learningObjectiveIds: [learningObjectiveId],
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  moduleId,
  title: 'Defining a claim (updated)',
  summary: 'Refreshed summary.',
  visibility: 'published' as const,
  accessPolicy: 'course_member' as const,
  position: 0,
  learningObjectiveIds: [learningObjectiveId],
};

describe('course unit update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseUnit.mockResolvedValue(sampleUnit());
    coreMocks.deleteCourseUnit.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a course unit for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseUnit(actorUserId, tenantId, courseId, courseUnitId, updateInput),
    ).resolves.toMatchObject({ id: courseUnitId, version: 2 });

    expect(coreMocks.updateCourseUnit).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseUnitId,
      moduleId,
      title: 'Defining a claim (updated)',
      summary: 'Refreshed summary.',
      visibility: 'published',
      accessPolicy: 'course_member',
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('returns not found when updating a missing course unit', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseUnit.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseUnit(actorUserId, tenantId, courseId, courseUnitId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course unit was not found. Check the unit id and retry the request.',
    });
  });

  it('rejects students from updating course units', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseUnit(actorUserId, tenantId, courseId, courseUnitId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseUnit).not.toHaveBeenCalled();
  });

  it('deletes a course unit for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseUnit(actorUserId, tenantId, courseId, courseUnitId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseUnit).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseUnitId,
    });
  });

  it('returns not found when deleting a missing course unit', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseUnit.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseUnit(actorUserId, tenantId, courseId, courseUnitId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course unit was not found. Check the unit id and retry the request.',
    });
  });

  it('rejects students from deleting course units', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseUnit(actorUserId, tenantId, courseId, courseUnitId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseUnit).not.toHaveBeenCalled();
  });
});
