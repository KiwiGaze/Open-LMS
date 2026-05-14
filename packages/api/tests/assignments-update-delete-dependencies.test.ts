import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateAssignment: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteAssignment: coreMocks.deleteAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateAssignment: coreMocks.updateAssignment,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleAssignment = () => ({
  id: assignmentId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Essay 1: Defending a thesis (updated)',
  instructions: 'Refreshed instructions.',
  status: 'published',
  dueAt: null,
  allowResubmission: true,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
  },
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Essay 1: Defending a thesis (updated)',
  instructions: 'Refreshed instructions.',
  status: 'published' as const,
  dueAt: null,
  allowResubmission: true,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
  },
};

describe('assignment update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateAssignment.mockResolvedValue(sampleAssignment());
    coreMocks.deleteAssignment.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates an assignment for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignment(actorUserId, tenantId, courseId, assignmentId, updateInput),
    ).resolves.toMatchObject({ id: assignmentId, title: 'Essay 1: Defending a thesis (updated)' });

    expect(coreMocks.updateAssignment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      assignmentId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing assignment', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateAssignment.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignment(actorUserId, tenantId, courseId, assignmentId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });
  });

  it('returns bad_request when update references missing rubric', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateAssignment.mockRejectedValue({
      code: '23503',
      constraint_name: 'assignment_tenant_active_rubric_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignment(actorUserId, tenantId, courseId, assignmentId, updateInput),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('rejects students from updating assignments', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignment(actorUserId, tenantId, courseId, assignmentId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateAssignment).not.toHaveBeenCalled();
  });

  it('deletes an assignment for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignment(actorUserId, tenantId, courseId, assignmentId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteAssignment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      assignmentId,
    });
  });

  it('returns not found when deleting a missing assignment', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteAssignment.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignment(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });
  });

  it('rejects students from deleting assignments', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignment(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteAssignment).not.toHaveBeenCalled();
  });
});
