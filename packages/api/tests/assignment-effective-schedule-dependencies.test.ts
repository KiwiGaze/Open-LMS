import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAssignmentById: vi.fn(),
  listAssignmentOverridesForAssignment: vi.fn(),
  listCourseGroupMembershipsForUser: vi.fn(),
  listSectionMembershipsForStudent: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    listAssignmentOverridesForAssignment: coreMocks.listAssignmentOverridesForAssignment,
    listCourseGroupMembershipsForUser: coreMocks.listCourseGroupMembershipsForUser,
    listSectionMembershipsForStudent: coreMocks.listSectionMembershipsForStudent,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE40';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE41';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE42';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE43';
const overrideId = '01J9QW7B6N5W2YH3D3A1V0KE44';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE45';
const baseDueAt = new Date('2026-05-15T23:59:00.000Z');
const overrideDueAt = new Date('2026-05-20T23:59:00.000Z');
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

const sampleAssignment = (
  overrides: Partial<{ status: 'draft' | 'published' | 'archived' }> = {},
) => ({
  id: assignmentId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Essay 1',
  instructions: 'Defend a thesis using evidence.',
  status: overrides.status ?? 'published',
  dueAt: baseDueAt,
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

const sampleOverride = (
  overrides: Partial<{
    targetType: 'user' | 'group' | 'section';
    targetId: string;
    dueAt: Date | null;
  }> = {},
) => ({
  id: overrideId,
  tenantId,
  assignmentId,
  targetType: overrides.targetType ?? 'user',
  targetId: overrides.targetId ?? actorUserId,
  opensAt: null,
  dueAt: overrides.dueAt ?? overrideDueAt,
  closesAt: null,
  status: 'active' as const,
  createdAt: now,
  updatedAt: now,
});

describe('assignment effective-schedule API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.listAssignmentOverridesForAssignment.mockResolvedValue([]);
    coreMocks.listCourseGroupMembershipsForUser.mockResolvedValue([]);
    coreMocks.listSectionMembershipsForStudent.mockResolvedValue([]);
    configureCourseAccess('student', 'student');
  });

  it('returns the base dueAt when no overrides apply', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.getAssignmentEffectiveSchedule(actorUserId, tenantId, courseId, assignmentId),
    ).resolves.toMatchObject({
      assignmentId,
      dueAt: baseDueAt,
      opensAt: null,
      closesAt: null,
    });

    expect(coreMocks.listAssignmentOverridesForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({ tenantId, assignmentId, statuses: ['active'] }),
    );
  });

  it('uses a user-targeted override dueAt when one applies to the learner', async () => {
    coreMocks.listAssignmentOverridesForAssignment.mockResolvedValue([
      sampleOverride({ targetType: 'user', targetId: actorUserId, dueAt: overrideDueAt }),
    ]);
    const dependencies = createDependencies();

    const schedule = await dependencies.getAssignmentEffectiveSchedule(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    expect(schedule.dueAt).toEqual(overrideDueAt);
  });

  it('uses a group-targeted override dueAt when the learner is in that group', async () => {
    coreMocks.listAssignmentOverridesForAssignment.mockResolvedValue([
      sampleOverride({ targetType: 'group', targetId: groupId, dueAt: overrideDueAt }),
    ]);
    coreMocks.listCourseGroupMembershipsForUser.mockResolvedValue([{ tenantId, groupId }]);
    const dependencies = createDependencies();

    const schedule = await dependencies.getAssignmentEffectiveSchedule(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    expect(schedule.dueAt).toEqual(overrideDueAt);
  });

  it('hides draft assignments from students', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment({ status: 'draft' }));
    const dependencies = createDependencies();

    await expect(
      dependencies.getAssignmentEffectiveSchedule(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('lets staff see draft assignment effective schedules', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment({ status: 'draft' }));
    const dependencies = createDependencies();

    await expect(
      dependencies.getAssignmentEffectiveSchedule(actorUserId, tenantId, courseId, assignmentId),
    ).resolves.toMatchObject({ assignmentId });
  });

  it('returns not_found for unknown assignment ids', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getAssignmentEffectiveSchedule(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
