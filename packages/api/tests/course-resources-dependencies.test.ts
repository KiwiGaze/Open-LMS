import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseResource: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseResource: coreMocks.createCourseResource,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE8B';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE88';
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

const missingCourseResourceCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_resource_tenant_course_fk',
});

const missingCourseResourceModuleError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_resource_tenant_module_fk',
});

const missingCourseResourceUnitError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_resource_tenant_unit_fk',
});

describe('course resource API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseResource.mockResolvedValue({
      id: resourceId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      title: 'Argument structure primer',
      body: 'Claim → reasoning → evidence.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates course resources for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseResource(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        resourceType: 'reading_material',
        title: 'Argument structure primer',
        body: 'Claim → reasoning → evidence.',
        sourceUri: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).resolves.toMatchObject({
      id: resourceId,
      courseId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      version: 1,
    });

    expect(coreMocks.createCourseResource).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      unitId,
      resourceType: 'reading_material',
      title: 'Argument structure primer',
      body: 'Claim → reasoning → evidence.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('allows tenant staff to create top-level resources without module or unit', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseResource(actorUserId, tenantId, courseId, {
      moduleId: null,
      unitId: null,
      resourceType: 'external_link',
      title: 'Course welcome video',
      body: 'Watch before the first session.',
      sourceUri: 'https://example.test/welcome',
      visibility: 'draft',
      accessPolicy: 'course_staff',
      position: 1,
      learningObjectiveIds: [],
    });

    expect(coreMocks.createCourseResource).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      resourceType: 'external_link',
      title: 'Course welcome video',
      body: 'Watch before the first session.',
      sourceUri: 'https://example.test/welcome',
      visibility: 'draft',
      accessPolicy: 'course_staff',
      position: 1,
      learningObjectiveIds: [],
    });
  });

  it('rejects students creating course resources', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseResource(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        resourceType: 'reading_material',
        title: 'Argument structure primer',
        body: 'Claim → reasoning → evidence.',
        sourceUri: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course resources. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseResource).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseResource.mockRejectedValue(missingCourseResourceCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseResource(actorUserId, tenantId, courseId, {
        moduleId: null,
        unitId: null,
        resourceType: 'reading_material',
        title: 'Argument structure primer',
        body: 'Claim → reasoning → evidence.',
        sourceUri: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps missing modules to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseResource.mockRejectedValue(missingCourseResourceModuleError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseResource(actorUserId, tenantId, courseId, {
        moduleId,
        unitId: null,
        resourceType: 'reading_material',
        title: 'Argument structure primer',
        body: 'Claim → reasoning → evidence.',
        sourceUri: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Course module was not found in this tenant. Check the module id and retry the request.',
    });
  });

  it('maps missing units to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseResource.mockRejectedValue(missingCourseResourceUnitError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseResource(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        resourceType: 'reading_material',
        title: 'Argument structure primer',
        body: 'Claim → reasoning → evidence.',
        sourceUri: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course unit was not found in this tenant. Check the unit id and retry the request.',
    });
  });
});
