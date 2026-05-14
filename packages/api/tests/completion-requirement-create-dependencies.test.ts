import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCompletionRequirement: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCompletionRequirement: coreMocks.createCompletionRequirement,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const requirementId = '01J9QW7B6N5W2YH3D3A1V0KE8J';
const assignmentTargetId = '01J9QW7B6N5W2YH3D3A1V0KE8K';
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

const missingCompletionRequirementCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'completion_requirement_tenant_course_fk',
});

describe('completion requirement creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCompletionRequirement.mockResolvedValue({
      id: requirementId,
      tenantId,
      courseId,
      moduleId: null,
      title: 'Submit Essay 1',
      description: 'Submit the evidence-based essay before the unit progresses.',
      requirementType: 'submit_assignment',
      targetType: 'assignment',
      targetId: assignmentTargetId,
      minScorePercent: null,
      status: 'active',
      required: true,
      position: 0,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates completion requirements for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCompletionRequirement(actorUserId, tenantId, courseId, {
        title: 'Submit Essay 1',
        description: 'Submit the evidence-based essay before the unit progresses.',
        moduleId,
        requirementType: 'submit_assignment',
        targetType: 'assignment',
        targetId: assignmentTargetId,
        minScorePercent: null,
        status: 'active',
        required: true,
        position: 0,
      }),
    ).resolves.toMatchObject({
      id: requirementId,
      courseId,
      title: 'Submit Essay 1',
      requirementType: 'submit_assignment',
      targetType: 'assignment',
      targetId: assignmentTargetId,
      required: true,
    });

    expect(coreMocks.createCompletionRequirement).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Submit Essay 1',
      description: 'Submit the evidence-based essay before the unit progresses.',
      moduleId,
      requirementType: 'submit_assignment',
      targetType: 'assignment',
      targetId: assignmentTargetId,
      minScorePercent: null,
      status: 'active',
      required: true,
      position: 0,
    });
  });

  it('allows tenant staff without course membership to create completion requirements', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCompletionRequirement(actorUserId, tenantId, courseId, {
      title: 'Manual sign-off',
      description: null,
      moduleId: null,
      requirementType: 'manual',
      targetType: 'manual',
      targetId: null,
      minScorePercent: null,
      status: 'active',
      required: false,
      position: 1,
    });

    expect(coreMocks.createCompletionRequirement).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Manual sign-off',
      description: null,
      moduleId: null,
      requirementType: 'manual',
      targetType: 'manual',
      targetId: null,
      minScorePercent: null,
      status: 'active',
      required: false,
      position: 1,
    });
  });

  it('rejects students creating completion requirements', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCompletionRequirement(actorUserId, tenantId, courseId, {
        title: 'Submit Essay 1',
        description: null,
        moduleId: null,
        requirementType: 'submit_assignment',
        targetType: 'assignment',
        targetId: assignmentTargetId,
        minScorePercent: null,
        status: 'active',
        required: true,
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only course staff can create completion requirements. Ask an instructor for access.',
    });

    expect(coreMocks.createCompletionRequirement).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCompletionRequirement.mockRejectedValue(
      missingCompletionRequirementCourseError(),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.createCompletionRequirement(actorUserId, tenantId, courseId, {
        title: 'Submit Essay 1',
        description: null,
        moduleId: null,
        requirementType: 'submit_assignment',
        targetType: 'assignment',
        targetId: assignmentTargetId,
        minScorePercent: null,
        status: 'active',
        required: true,
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
