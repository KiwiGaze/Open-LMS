import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getNextPositionForScope: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getNextPositionForScope: coreMocks.getNextPositionForScope,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE87';

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

describe('course next-position API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getNextPositionForScope.mockResolvedValue(5);
    configureCourseAccess('student', 'student');
  });

  it('returns next position for course_module to course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseNextPosition(actorUserId, tenantId, courseId, {
        kind: 'course_module',
      }),
    ).resolves.toEqual({ nextPosition: 5 });

    expect(coreMocks.getNextPositionForScope).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      kind: 'course_module',
      tenantId,
      courseId,
    });
  });

  it('forwards moduleId for course_unit scope', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getNextPositionForScope.mockResolvedValue(2);
    const dependencies = createDependencies();

    const result = await dependencies.getCourseNextPosition(actorUserId, tenantId, courseId, {
      kind: 'course_unit',
      moduleId,
    });

    expect(result).toEqual({ nextPosition: 2 });
    expect(coreMocks.getNextPositionForScope).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      kind: 'course_unit',
      tenantId,
      courseId,
      moduleId,
    });
  });

  it('returns 0 when no existing items', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getNextPositionForScope.mockResolvedValue(0);
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseNextPosition(actorUserId, tenantId, courseId, {
        kind: 'course_section',
      }),
    ).resolves.toEqual({ nextPosition: 0 });
  });

  it('rejects students from reading auto-positions', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseNextPosition(actorUserId, tenantId, courseId, {
        kind: 'course_module',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getNextPositionForScope).not.toHaveBeenCalled();
  });

  it('handles gradebook_category scope', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getNextPositionForScope.mockResolvedValue(3);
    const dependencies = createDependencies();

    const result = await dependencies.getCourseNextPosition(actorUserId, tenantId, courseId, {
      kind: 'gradebook_category',
    });

    expect(result).toEqual({ nextPosition: 3 });
  });
});
