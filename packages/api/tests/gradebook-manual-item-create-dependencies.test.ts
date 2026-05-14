import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createGradebookManualItem: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createGradebookManualItem: coreMocks.createGradebookManualItem,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const categoryId = '01J9QW7B6N5W2YH3D3A1V0KE8F';
const manualItemId = '01J9QW7B6N5W2YH3D3A1V0KE8L';
const dueAt = new Date('2026-09-15T17:00:00.000Z');
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

const missingCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'gradebook_manual_item_tenant_course_fk',
});

const missingCategoryError = (): unknown => ({
  code: '23503',
  constraint_name: 'gradebook_manual_item_tenant_course_category_fk',
});

const duplicatePositionError = (): unknown => ({
  code: '23505',
  constraint_name: 'gradebook_manual_item_tenant_course_position_uq',
});

describe('gradebook manual item creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createGradebookManualItem.mockResolvedValue({
      id: manualItemId,
      tenantId,
      courseId,
      gradebookCategoryId: categoryId,
      title: 'Participation',
      description: 'Weekly discussion contributions.',
      maxScore: 100,
      dueAt,
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates manual gradebook items for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookManualItem(actorUserId, tenantId, courseId, {
        gradebookCategoryId: categoryId,
        title: 'Participation',
        description: 'Weekly discussion contributions.',
        maxScore: 100,
        dueAt,
        position: 0,
        status: 'active',
      }),
    ).resolves.toMatchObject({
      id: manualItemId,
      courseId,
      gradebookCategoryId: categoryId,
      title: 'Participation',
      maxScore: 100,
      position: 0,
    });

    expect(coreMocks.createGradebookManualItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookCategoryId: categoryId,
      title: 'Participation',
      description: 'Weekly discussion contributions.',
      maxScore: 100,
      dueAt,
      position: 0,
      status: 'active',
    });
  });

  it('allows tenant staff to create uncategorized manual items', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createGradebookManualItem(actorUserId, tenantId, courseId, {
      gradebookCategoryId: null,
      title: 'Bonus presentation',
      description: null,
      maxScore: 10,
      dueAt: null,
      position: 1,
      status: 'active',
    });

    expect(coreMocks.createGradebookManualItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookCategoryId: null,
      title: 'Bonus presentation',
      description: null,
      maxScore: 10,
      dueAt: null,
      position: 1,
      status: 'active',
    });
  });

  it('rejects students creating manual gradebook items', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookManualItem(actorUserId, tenantId, courseId, {
        gradebookCategoryId: categoryId,
        title: 'Participation',
        description: null,
        maxScore: 100,
        dueAt: null,
        position: 0,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create manual gradebook items. Ask an instructor for access.',
    });

    expect(coreMocks.createGradebookManualItem).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createGradebookManualItem.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookManualItem(actorUserId, tenantId, courseId, {
        gradebookCategoryId: null,
        title: 'Participation',
        description: null,
        maxScore: 100,
        dueAt: null,
        position: 0,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps missing gradebook categories to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createGradebookManualItem.mockRejectedValue(missingCategoryError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookManualItem(actorUserId, tenantId, courseId, {
        gradebookCategoryId: categoryId,
        title: 'Participation',
        description: null,
        maxScore: 100,
        dueAt: null,
        position: 0,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Gradebook category was not found in this course. Check the category id and retry the request.',
    });
  });

  it('maps duplicate positions to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createGradebookManualItem.mockRejectedValue(duplicatePositionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradebookManualItem(actorUserId, tenantId, courseId, {
        gradebookCategoryId: null,
        title: 'Participation',
        description: null,
        maxScore: 100,
        dueAt: null,
        position: 0,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Manual gradebook item position is already used in this course. Choose a unique position and retry the request.',
    });
  });
});
