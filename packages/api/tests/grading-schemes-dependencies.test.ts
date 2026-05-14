import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  listCourseGradingSchemesForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listCourseGradingSchemesForCourse: coreMocks.listCourseGradingSchemesForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';

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

describe('grading scheme API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseGradingSchemesForCourse.mockResolvedValue([]);
    configureCourseAccess('student', 'student');
  });

  it('lists active grading schemes for students', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseGradingSchemes(actorUserId, tenantId, courseId),
    ).resolves.toEqual([]);

    expect(coreMocks.listCourseGradingSchemesForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        statuses: ['active'],
      },
    );
  });

  it('lists active and archived grading schemes for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listCourseGradingSchemes(actorUserId, tenantId, courseId);

    expect(coreMocks.listCourseGradingSchemesForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        statuses: ['active', 'archived'],
      },
    );
  });

  it('lists active and archived grading schemes for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.listCourseGradingSchemes(actorUserId, tenantId, courseId);

    expect(coreMocks.listCourseGradingSchemesForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        statuses: ['active', 'archived'],
      },
    );
  });

  it('rejects grading schemes for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseGradingSchemes(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.listCourseGradingSchemesForCourse).not.toHaveBeenCalled();
  });
});
