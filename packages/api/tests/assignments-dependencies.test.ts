import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createAssignment: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createAssignment: coreMocks.createAssignment,
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
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE8E';
const rubricId = '01J9QW7B6N5W2YH3D3A1V0KE3C';
const dueAt = new Date('2026-09-15T17:00:00.000Z');
const now = new Date('2026-05-10T00:00:00.000Z');

const defaultAiSettings = {
  precheckEnabled: false,
  feedbackDraftEnabled: false,
  scoreSuggestionEnabled: false,
};

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

const missingAssignmentCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'assignment_tenant_course_fk',
});

const missingAssignmentModuleError = (): unknown => ({
  code: '23503',
  constraint_name: 'assignment_tenant_module_fk',
});

const missingAssignmentRubricError = (): unknown => ({
  code: '23503',
  constraint_name: 'assignment_tenant_active_rubric_fk',
});

describe('assignment creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createAssignment.mockResolvedValue({
      id: assignmentId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Essay 1: Defending a thesis',
      instructions: 'Argue your interpretation of the text using cited evidence.',
      status: 'published',
      dueAt,
      allowResubmission: true,
      activeRubricId: rubricId,
      aiSettings: defaultAiSettings,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates assignments for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignment(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        position: 0,
        title: 'Essay 1: Defending a thesis',
        instructions: 'Argue your interpretation of the text using cited evidence.',
        status: 'published',
        dueAt,
        allowResubmission: true,
        activeRubricId: rubricId,
        aiSettings: defaultAiSettings,
      }),
    ).resolves.toMatchObject({
      id: assignmentId,
      courseId,
      title: 'Essay 1: Defending a thesis',
      status: 'published',
      activeRubricId: rubricId,
    });

    expect(coreMocks.createAssignment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Essay 1: Defending a thesis',
      instructions: 'Argue your interpretation of the text using cited evidence.',
      status: 'published',
      dueAt,
      allowResubmission: true,
      activeRubricId: rubricId,
      aiSettings: defaultAiSettings,
    });
  });

  it('allows tenant staff to create top-level assignments without parent refs', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createAssignment(actorUserId, tenantId, courseId, {
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Draft assignment under review',
      instructions: 'Placeholder text — instructor will refine.',
      status: 'draft',
      dueAt: null,
      allowResubmission: false,
      activeRubricId: null,
      aiSettings: defaultAiSettings,
    });

    expect(coreMocks.createAssignment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Draft assignment under review',
      instructions: 'Placeholder text — instructor will refine.',
      status: 'draft',
      dueAt: null,
      allowResubmission: false,
      activeRubricId: null,
      aiSettings: defaultAiSettings,
    });
  });

  it('rejects students creating assignments', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignment(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        position: 0,
        title: 'Essay 1: Defending a thesis',
        instructions: 'Argue your interpretation of the text using cited evidence.',
        status: 'published',
        dueAt,
        allowResubmission: true,
        activeRubricId: rubricId,
        aiSettings: defaultAiSettings,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create assignments. Ask an instructor for access.',
    });

    expect(coreMocks.createAssignment).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createAssignment.mockRejectedValue(missingAssignmentCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignment(actorUserId, tenantId, courseId, {
        moduleId: null,
        unitId: null,
        position: null,
        title: 'Essay',
        instructions: 'Write an essay.',
        status: 'draft',
        dueAt: null,
        allowResubmission: false,
        activeRubricId: null,
        aiSettings: defaultAiSettings,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps missing modules to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createAssignment.mockRejectedValue(missingAssignmentModuleError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignment(actorUserId, tenantId, courseId, {
        moduleId,
        unitId: null,
        position: 0,
        title: 'Essay',
        instructions: 'Write an essay.',
        status: 'draft',
        dueAt: null,
        allowResubmission: false,
        activeRubricId: null,
        aiSettings: defaultAiSettings,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Course module was not found in this tenant. Check the module id and retry the request.',
    });
  });

  it('maps missing rubrics to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createAssignment.mockRejectedValue(missingAssignmentRubricError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignment(actorUserId, tenantId, courseId, {
        moduleId: null,
        unitId: null,
        position: null,
        title: 'Essay',
        instructions: 'Write an essay.',
        status: 'draft',
        dueAt: null,
        allowResubmission: false,
        activeRubricId: rubricId,
        aiSettings: defaultAiSettings,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Rubric was not found in this tenant. Check the rubric id and retry the request.',
    });
  });
});
