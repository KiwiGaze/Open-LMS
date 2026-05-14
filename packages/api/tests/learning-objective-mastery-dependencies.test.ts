import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  listLearningObjectiveMasteryForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listLearningObjectiveMasteryForCourse: coreMocks.listLearningObjectiveMasteryForCourse,
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

describe('learning objective mastery API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listLearningObjectiveMasteryForCourse.mockResolvedValue([]);
    configureCourseAccess('student', 'student');
  });

  it('lists only the signed-in student mastery records for students', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listLearningObjectiveMastery(actorUserId, tenantId, courseId),
    ).resolves.toEqual([]);

    expect(coreMocks.listLearningObjectiveMasteryForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        studentId: actorUserId,
      },
    );
  });

  it('lists all course mastery records for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listLearningObjectiveMastery(actorUserId, tenantId, courseId);

    expect(coreMocks.listLearningObjectiveMasteryForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        studentId: undefined,
      },
    );
  });

  it('lists all course mastery records for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.listLearningObjectiveMastery(actorUserId, tenantId, courseId);

    expect(coreMocks.listLearningObjectiveMasteryForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        studentId: undefined,
      },
    );
  });

  it('rejects mastery records for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listLearningObjectiveMastery(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.listLearningObjectiveMasteryForCourse).not.toHaveBeenCalled();
  });
});
