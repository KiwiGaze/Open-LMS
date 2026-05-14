import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteGradebookManualItem: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateGradebookManualItem: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteGradebookManualItem: coreMocks.deleteGradebookManualItem,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateGradebookManualItem: coreMocks.updateGradebookManualItem,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const gradebookManualItemId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleItem = () => ({
  id: gradebookManualItemId,
  tenantId,
  courseId,
  gradebookCategoryId: null,
  title: 'Participation (updated)',
  description: 'Refreshed description.',
  maxScore: 150,
  dueAt: null,
  position: 0,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  gradebookCategoryId: null,
  title: 'Participation (updated)',
  description: 'Refreshed description.',
  maxScore: 150,
  dueAt: null,
  position: 0,
  status: 'active' as const,
};

describe('gradebook manual item update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateGradebookManualItem.mockResolvedValue(sampleItem());
    coreMocks.deleteGradebookManualItem.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a gradebook manual item for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: gradebookManualItemId, maxScore: 150 });

    expect(coreMocks.updateGradebookManualItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookManualItemId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing manual item', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGradebookManualItem.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Manual gradebook item was not found in this course. Check the item id and retry the request.',
    });
  });

  it('returns bad_request when update references missing category', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGradebookManualItem.mockRejectedValue({
      code: '23503',
      constraint_name: 'gradebook_manual_item_tenant_course_category_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('returns conflict when update collides on position', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateGradebookManualItem.mockRejectedValue({
      code: '23505',
      constraint_name: 'gradebook_manual_item_tenant_course_position_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('rejects students from updating gradebook manual items', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateGradebookManualItem).not.toHaveBeenCalled();
  });

  it('deletes a gradebook manual item for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
      ),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteGradebookManualItem).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      gradebookManualItemId,
    });
  });

  it('returns not found when deleting a missing manual item', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteGradebookManualItem.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Manual gradebook item was not found in this course. Check the item id and retry the request.',
    });
  });

  it('rejects students from deleting gradebook manual items', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteGradebookManualItem(
        actorUserId,
        tenantId,
        courseId,
        gradebookManualItemId,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteGradebookManualItem).not.toHaveBeenCalled();
  });
});
