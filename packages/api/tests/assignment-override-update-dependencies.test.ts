import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createAssignmentOverride: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteAssignmentOverride: vi.fn(),
  getAssignmentById: vi.fn(),
  getAssignmentOverrideById: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateAssignmentOverride: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createAssignmentOverride: coreMocks.createAssignmentOverride,
    createDbHandle: coreMocks.createDbHandle,
    deleteAssignmentOverride: coreMocks.deleteAssignmentOverride,
    getAssignmentById: coreMocks.getAssignmentById,
    getAssignmentOverrideById: coreMocks.getAssignmentOverrideById,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateAssignmentOverride: coreMocks.updateAssignmentOverride,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE92';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE93';
const overrideId = '01J9QW7B6N5W2YH3D3A1V0KE94';
const newDueAt = new Date('2026-05-20T23:59:00.000Z');
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

const sampleAssignment = () => ({
  id: assignmentId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Essay 1',
  instructions: 'Defend a thesis.',
  status: 'published' as const,
  dueAt: null,
  allowResubmission: false,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
  },
  latePenaltyPercentPerDay: null,
  lateMaxPenaltyPercent: null,
  createdAt: now,
  updatedAt: now,
});

const sampleOverride = (overrides: Partial<{ assignmentId: string }> = {}) => ({
  id: overrideId,
  tenantId,
  assignmentId: overrides.assignmentId ?? assignmentId,
  targetType: 'user' as const,
  targetId: actorUserId,
  opensAt: null,
  dueAt: null,
  closesAt: null,
  status: 'active' as const,
  createdAt: now,
  updatedAt: now,
});

describe('assignment override update API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.getAssignmentOverrideById.mockResolvedValue(sampleOverride());
    coreMocks.updateAssignmentOverride.mockResolvedValue({
      ...sampleOverride(),
      dueAt: newDueAt,
      updatedAt: new Date('2026-05-11T00:00:00.000Z'),
    });
  });

  it('updates an override for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
        { opensAt: null, dueAt: newDueAt, closesAt: null, status: 'active' },
      ),
    ).resolves.toMatchObject({ id: overrideId, dueAt: newDueAt });

    expect(coreMocks.updateAssignmentOverride).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      overrideId,
      opensAt: null,
      dueAt: newDueAt,
      closesAt: null,
      status: 'active',
    });
  });

  it('rejects students with forbidden', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
        { opensAt: null, dueAt: newDueAt, closesAt: null, status: 'active' },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateAssignmentOverride).not.toHaveBeenCalled();
  });

  it('returns not_found when the override belongs to a different assignment', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentOverrideById.mockResolvedValue(
      sampleOverride({ assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE95' }),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
        { opensAt: null, dueAt: newDueAt, closesAt: null, status: 'active' },
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('returns not_found when the override does not exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentOverrideById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
        { opensAt: null, dueAt: newDueAt, closesAt: null, status: 'active' },
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('assignment override create API dependency', () => {
  const targetUserId = '01J9QW7B6N5W2YH3D3A1V0KE96';

  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.createAssignmentOverride.mockResolvedValue({
      ...sampleOverride(),
      id: '01J9QW7B6N5W2YH3D3A1V0KE97',
      targetId: targetUserId,
      dueAt: newDueAt,
    });
  });

  it('creates an override for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignmentOverride(actorUserId, tenantId, courseId, assignmentId, {
        targetType: 'user',
        targetId: targetUserId,
        opensAt: null,
        dueAt: newDueAt,
        closesAt: null,
        status: 'active',
      }),
    ).resolves.toMatchObject({ targetId: targetUserId, dueAt: newDueAt });

    expect(coreMocks.createAssignmentOverride).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      assignmentId,
      targetType: 'user',
      targetId: targetUserId,
      opensAt: null,
      dueAt: newDueAt,
      closesAt: null,
      status: 'active',
    });
  });

  it('rejects students with forbidden', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignmentOverride(actorUserId, tenantId, courseId, assignmentId, {
        targetType: 'user',
        targetId: targetUserId,
        opensAt: null,
        dueAt: newDueAt,
        closesAt: null,
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.createAssignmentOverride).not.toHaveBeenCalled();
  });

  it('returns conflict when an override already exists for the target', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.createAssignmentOverride.mockRejectedValue({
      code: '23505',
      constraint_name: 'assignment_override_tenant_assignment_target_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignmentOverride(actorUserId, tenantId, courseId, assignmentId, {
        targetType: 'user',
        targetId: targetUserId,
        opensAt: null,
        dueAt: newDueAt,
        closesAt: null,
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('returns not_found when the assignment does not exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createAssignmentOverride(actorUserId, tenantId, courseId, assignmentId, {
        targetType: 'user',
        targetId: targetUserId,
        opensAt: null,
        dueAt: newDueAt,
        closesAt: null,
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.createAssignmentOverride).not.toHaveBeenCalled();
  });
});

describe('assignment override delete API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.getAssignmentOverrideById.mockResolvedValue(sampleOverride());
    coreMocks.deleteAssignmentOverride.mockResolvedValue(true);
  });

  it('deletes an override for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
      ),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteAssignmentOverride).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      overrideId,
    });
  });

  it('rejects students with forbidden', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteAssignmentOverride).not.toHaveBeenCalled();
  });

  it('returns not_found when the override does not exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentOverrideById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.deleteAssignmentOverride).not.toHaveBeenCalled();
  });

  it('returns not_found when the override belongs to a different assignment', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentOverrideById.mockResolvedValue(
      sampleOverride({ assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE99' }),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteAssignmentOverride(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        overrideId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.deleteAssignmentOverride).not.toHaveBeenCalled();
  });
});
