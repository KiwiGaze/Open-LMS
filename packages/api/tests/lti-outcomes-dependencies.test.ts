import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCourseExternalToolOutcomesForAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordCourseExternalToolOutcome: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listCourseExternalToolOutcomesForAssignment:
      coreMocks.listCourseExternalToolOutcomesForAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordCourseExternalToolOutcome: coreMocks.recordCourseExternalToolOutcome,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const externalToolId = '01J9QW7B6N5W2YH3D3A1V0KE89';
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

const sampleOutcome = () => ({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3Z',
  tenantId,
  courseId,
  assignmentId,
  studentId,
  externalToolId,
  score: 85,
  maxScore: 100,
  status: 'published',
  reportedAt: now,
  createdAt: now,
  updatedAt: now,
});

const recordInput = {
  studentId,
  externalToolId,
  score: 85,
  maxScore: 100,
  status: 'published' as const,
  reportedAt: now,
};

describe('LTI outcomes API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.recordCourseExternalToolOutcome.mockResolvedValue(sampleOutcome());
    coreMocks.listCourseExternalToolOutcomesForAssignment.mockResolvedValue([sampleOutcome()]);
    configureCourseAccess('student', 'student');
  });

  it('records an outcome for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.recordCourseExternalToolOutcome(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        recordInput,
      ),
    ).resolves.toMatchObject({ id: '01J9QW7B6N5W2YH3D3A1V0KE3Z', score: 85 });

    expect(coreMocks.recordCourseExternalToolOutcome).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      assignmentId,
      ...recordInput,
    });
  });

  it('maps FK errors to bad_request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.recordCourseExternalToolOutcome.mockRejectedValue({
      code: '23503',
      constraint_name: 'course_external_tool_outcome_tenant_assignment_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.recordCourseExternalToolOutcome(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        recordInput,
      ),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('rejects students from recording outcomes', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.recordCourseExternalToolOutcome(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        recordInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.recordCourseExternalToolOutcome).not.toHaveBeenCalled();
  });

  it('lists outcomes for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const outcomes = await dependencies.listCourseExternalToolOutcomes(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    expect(outcomes).toHaveLength(1);
    expect(coreMocks.listCourseExternalToolOutcomesForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      { tenantId, courseId, assignmentId },
    );
  });

  it('rejects students from listing outcomes', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listCourseExternalToolOutcomes(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listCourseExternalToolOutcomesForAssignment).not.toHaveBeenCalled();
  });
});
