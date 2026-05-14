import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  reorderInScope: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    reorderInScope: coreMocks.reorderInScope,
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

describe('course content reorder API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.reorderInScope.mockResolvedValue({ reordered: 3 });
    configureCourseAccess('student', 'student');
  });

  it('applies a course_module reorder for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const ids = ['mod_a', 'mod_b', 'mod_c'];
    await expect(
      dependencies.reorderCourseContent(actorUserId, tenantId, courseId, {
        scope: { kind: 'course_module' },
        orderedIds: ids,
      }),
    ).resolves.toEqual({ reordered: 3 });

    expect(coreMocks.reorderInScope).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      { kind: 'course_module', tenantId, courseId },
      ids,
    );
  });

  it('forwards moduleId for course_unit scope', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.reorderCourseContent(actorUserId, tenantId, courseId, {
      scope: { kind: 'course_unit', moduleId },
      orderedIds: ['unit_a', 'unit_b'],
    });

    expect(coreMocks.reorderInScope).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      { kind: 'course_unit', tenantId, courseId, moduleId },
      ['unit_a', 'unit_b'],
    );
  });

  it('maps duplicate id errors to bad_request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.reorderInScope.mockRejectedValue(new Error('Duplicate id in orderedIds: mod_a'));
    const dependencies = createDependencies();

    await expect(
      dependencies.reorderCourseContent(actorUserId, tenantId, courseId, {
        scope: { kind: 'course_module' },
        orderedIds: ['mod_a', 'mod_a'],
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'orderedIds contains duplicate values.',
    });
  });

  it('maps unknown id errors to bad_request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.reorderInScope.mockRejectedValue(new Error('Id not found in scope: mod_x'));
    const dependencies = createDependencies();

    await expect(
      dependencies.reorderCourseContent(actorUserId, tenantId, courseId, {
        scope: { kind: 'course_module' },
        orderedIds: ['mod_x'],
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'orderedIds references items that are not in the requested scope.',
    });
  });

  it('rejects students from reordering course content', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.reorderCourseContent(actorUserId, tenantId, courseId, {
        scope: { kind: 'course_module' },
        orderedIds: ['mod_a'],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.reorderInScope).not.toHaveBeenCalled();
  });
});
