import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseModule: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseModule: coreMocks.createCourseModule,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE89';
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

const missingCourseModuleCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_module_tenant_course_fk',
});

describe('course module API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseModule.mockResolvedValue({
      id: moduleId,
      tenantId,
      courseId,
      title: 'Foundations of evidence-based writing',
      summary: 'Introduces the core argument structure used throughout the course.',
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

  it('creates course modules for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseModule(actorUserId, tenantId, courseId, {
        title: 'Foundations of evidence-based writing',
        summary: 'Introduces the core argument structure used throughout the course.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).resolves.toMatchObject({
      id: moduleId,
      courseId,
      title: 'Foundations of evidence-based writing',
      visibility: 'published',
      version: 1,
    });

    expect(coreMocks.createCourseModule).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Foundations of evidence-based writing',
      summary: 'Introduces the core argument structure used throughout the course.',
      visibility: 'published',
      accessPolicy: 'course_member',
      position: 0,
      learningObjectiveIds: [learningObjectiveId],
    });
  });

  it('allows tenant staff without course membership to create course modules', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseModule(actorUserId, tenantId, courseId, {
      title: 'Draft module under review',
      summary: null,
      visibility: 'draft',
      accessPolicy: 'course_staff',
      position: 1,
      learningObjectiveIds: [],
    });

    expect(coreMocks.createCourseModule).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Draft module under review',
      summary: null,
      visibility: 'draft',
      accessPolicy: 'course_staff',
      position: 1,
      learningObjectiveIds: [],
    });
  });

  it('rejects students creating course modules', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseModule(actorUserId, tenantId, courseId, {
        title: 'Foundations of evidence-based writing',
        summary: 'Introduces the core argument structure used throughout the course.',
        visibility: 'published',
        accessPolicy: 'course_member',
        position: 0,
        learningObjectiveIds: [learningObjectiveId],
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course modules. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseModule).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseModule.mockRejectedValue(missingCourseModuleCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseModule(actorUserId, tenantId, courseId, {
        title: 'Foundations of evidence-based writing',
        summary: 'Introduces the core argument structure used throughout the course.',
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
});
