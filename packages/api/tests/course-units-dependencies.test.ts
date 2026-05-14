import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseUnit: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseUnit: coreMocks.createCourseUnit,
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

const missingCourseUnitCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_unit_tenant_course_fk',
});

const missingCourseUnitModuleError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_unit_tenant_module_fk',
});

describe('course unit API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseUnit.mockResolvedValue({
      id: unitId,
      tenantId,
      courseId,
      moduleId,
      title: 'Defining a claim',
      summary: 'How to phrase a defensible thesis statement.',
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

  it('creates course units for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseUnit(actorUserId, tenantId, courseId, {
        moduleId,
        title: 'Defining a claim',
        summary: 'How to phrase a defensible thesis statement.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).resolves.toMatchObject({
      id: unitId,
      courseId,
      moduleId,
      title: 'Defining a claim',
      version: 1,
    });

    expect(coreMocks.createCourseUnit).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      title: 'Defining a claim',
      summary: 'How to phrase a defensible thesis statement.',
      visibility: 'published',
      accessPolicy: 'course_member',
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('allows tenant staff without course membership to create course units', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseUnit(actorUserId, tenantId, courseId, {
      moduleId,
      title: 'Draft unit under review',
      summary: null,
      visibility: 'draft',
      accessPolicy: 'course_staff',
      position: 1,
      learningObjectiveIds: [],
    });

    expect(coreMocks.createCourseUnit).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      title: 'Draft unit under review',
      summary: null,
      visibility: 'draft',
      accessPolicy: 'course_staff',
      position: 1,
      learningObjectiveIds: [],
    });
  });

  it('rejects students creating course units', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseUnit(actorUserId, tenantId, courseId, {
        moduleId,
        title: 'Defining a claim',
        summary: 'How to phrase a defensible thesis statement.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course units. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseUnit).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseUnit.mockRejectedValue(missingCourseUnitCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseUnit(actorUserId, tenantId, courseId, {
        moduleId,
        title: 'Defining a claim',
        summary: 'How to phrase a defensible thesis statement.',
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
    coreMocks.createCourseUnit.mockRejectedValue(missingCourseUnitModuleError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseUnit(actorUserId, tenantId, courseId, {
        moduleId,
        title: 'Defining a claim',
        summary: 'How to phrase a defensible thesis statement.',
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
});
