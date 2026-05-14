import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseResource: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseResource: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseResource: coreMocks.deleteCourseResource,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseResource: coreMocks.updateCourseResource,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const courseResourceId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
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

const sampleResource = () => ({
  id: courseResourceId,
  tenantId,
  courseId,
  moduleId,
  unitId,
  resourceType: 'reading_material',
  title: 'Argument structure primer (updated)',
  body: 'Refreshed body.',
  sourceUri: null,
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
  unitId,
  resourceType: 'reading_material' as const,
  title: 'Argument structure primer (updated)',
  body: 'Refreshed body.',
  sourceUri: null,
  visibility: 'published' as const,
  accessPolicy: 'course_member' as const,
  position: 0,
  learningObjectiveIds: [learningObjectiveId],
};

describe('course resource update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseResource.mockResolvedValue(sampleResource());
    coreMocks.deleteCourseResource.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a course resource for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseResource(
        actorUserId,
        tenantId,
        courseId,
        courseResourceId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: courseResourceId, version: 2 });

    expect(coreMocks.updateCourseResource).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseResourceId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      title: 'Argument structure primer (updated)',
      body: 'Refreshed body.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('returns not found when updating a missing course resource', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseResource.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseResource(
        actorUserId,
        tenantId,
        courseId,
        courseResourceId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course resource was not found. Check the resource id and retry the request.',
    });
  });

  it('returns bad_request when update references missing module', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseResource.mockRejectedValue({
      code: '23503',
      constraint_name: 'course_resource_tenant_module_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseResource(
        actorUserId,
        tenantId,
        courseId,
        courseResourceId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('returns bad_request when update has module/unit mismatch', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseResource.mockRejectedValue({
      code: '23503',
      constraint_name: 'course_resource_tenant_module_unit_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseResource(
        actorUserId,
        tenantId,
        courseId,
        courseResourceId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('rejects students from updating course resources', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseResource(
        actorUserId,
        tenantId,
        courseId,
        courseResourceId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseResource).not.toHaveBeenCalled();
  });

  it('deletes a course resource for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseResource(actorUserId, tenantId, courseId, courseResourceId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseResource).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseResourceId,
    });
  });

  it('returns not found when deleting a missing course resource', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseResource.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseResource(actorUserId, tenantId, courseId, courseResourceId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course resource was not found. Check the resource id and retry the request.',
    });
  });

  it('rejects students from deleting course resources', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseResource(actorUserId, tenantId, courseId, courseResourceId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseResource).not.toHaveBeenCalled();
  });
});
