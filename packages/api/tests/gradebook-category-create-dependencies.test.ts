import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createGradebookCategory: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createGradebookCategory: coreMocks.createGradebookCategory,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const categoryId = '01J9QW7B6N5W2YH3D3A1V0KE8F';
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

const missingGradebookCategoryCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'gradebook_category_tenant_course_fk',
});

const duplicateGradebookCategoryPositionError = (): unknown => ({
  code: '23505',
  constraint_name: 'gradebook_category_tenant_course_position_uq',
});

describe('gradebook category creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createGradebookCategory.mockResolvedValue({
      id: categoryId,
      tenantId,
      courseId,
      name: 'Homework',
      position: 0,
      weightPercent: 40,
      dropLowest: 1,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates gradebook categories for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookCategory(actorUserId, tenantId, courseId, {
        name: 'Homework',
        position: 0,
        weightPercent: 40,
        dropLowest: 1,
        status: 'active',
      }),
    ).resolves.toMatchObject({
      id: categoryId,
      courseId,
      name: 'Homework',
      position: 0,
      weightPercent: 40,
      dropLowest: 1,
    });

    expect(coreMocks.createGradebookCategory).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Homework',
      position: 0,
      weightPercent: 40,
      dropLowest: 1,
      status: 'active',
    });
  });

  it('allows tenant staff without course membership to create gradebook categories', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createGradebookCategory(actorUserId, tenantId, courseId, {
      name: 'Participation',
      position: 1,
      weightPercent: null,
      dropLowest: 0,
      status: 'active',
    });

    expect(coreMocks.createGradebookCategory).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Participation',
      position: 1,
      weightPercent: null,
      dropLowest: 0,
      status: 'active',
    });
  });

  it('rejects students creating gradebook categories', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookCategory(actorUserId, tenantId, courseId, {
        name: 'Homework',
        position: 0,
        weightPercent: 40,
        dropLowest: 1,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create gradebook categories. Ask an instructor for access.',
    });

    expect(coreMocks.createGradebookCategory).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createGradebookCategory.mockRejectedValue(missingGradebookCategoryCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookCategory(actorUserId, tenantId, courseId, {
        name: 'Homework',
        position: 0,
        weightPercent: 40,
        dropLowest: 1,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps duplicate positions to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createGradebookCategory.mockRejectedValue(duplicateGradebookCategoryPositionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookCategory(actorUserId, tenantId, courseId, {
        name: 'Homework',
        position: 0,
        weightPercent: 40,
        dropLowest: 1,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Gradebook category position is already used in this course. Choose a unique position and retry the request.',
    });
  });
});
