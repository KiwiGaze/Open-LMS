import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteGradebookCategory: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateGradebookCategory: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteGradebookCategory: coreMocks.deleteGradebookCategory,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateGradebookCategory: coreMocks.updateGradebookCategory,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const gradebookCategoryId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleCategory = () => ({
  id: gradebookCategoryId,
  tenantId,
  courseId,
  name: 'Homework (updated)',
  position: 0,
  weightPercent: 50,
  dropLowest: 1,
  status: 'archived',
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  name: 'Homework (updated)',
  position: 0,
  weightPercent: 50,
  dropLowest: 1,
  status: 'archived' as const,
};

describe('gradebook category update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateGradebookCategory.mockResolvedValue(sampleCategory());
    coreMocks.deleteGradebookCategory.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a gradebook category for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookCategory(
        actorUserId,
        tenantId,
        courseId,
        gradebookCategoryId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: gradebookCategoryId, weightPercent: 50 });

    expect(coreMocks.updateGradebookCategory).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookCategoryId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing category', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGradebookCategory.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookCategory(
        actorUserId,
        tenantId,
        courseId,
        gradebookCategoryId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Gradebook category was not found in this course. Check the category id and retry the request.',
    });
  });

  it('returns conflict on duplicate position', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGradebookCategory.mockRejectedValue({
      code: '23505',
      constraint_name: 'gradebook_category_tenant_course_position_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookCategory(
        actorUserId,
        tenantId,
        courseId,
        gradebookCategoryId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('rejects students from updating gradebook categories', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookCategory(
        actorUserId,
        tenantId,
        courseId,
        gradebookCategoryId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateGradebookCategory).not.toHaveBeenCalled();
  });

  it('deletes a gradebook category for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGradebookCategory(actorUserId, tenantId, courseId, gradebookCategoryId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteGradebookCategory).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookCategoryId,
    });
  });

  it('returns not found when deleting a missing category', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteGradebookCategory.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGradebookCategory(actorUserId, tenantId, courseId, gradebookCategoryId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Gradebook category was not found in this course. Check the category id and retry the request.',
    });
  });

  it('rejects students from deleting gradebook categories', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGradebookCategory(actorUserId, tenantId, courseId, gradebookCategoryId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteGradebookCategory).not.toHaveBeenCalled();
  });
});
