import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getLearningObjectiveById: vi.fn(),
  getLearningObjectiveCoverage: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getLearningObjectiveById: coreMocks.getLearningObjectiveById,
    getLearningObjectiveCoverage: coreMocks.getLearningObjectiveCoverage,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE50';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE51';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE52';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE53';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE54';
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

const sampleObjective = (overrides: Partial<{ courseId: string }> = {}) => ({
  id: learningObjectiveId,
  tenantId,
  courseId: overrides.courseId ?? courseId,
  code: 'LO-1',
  title: 'Defend claims',
  description: null,
  status: 'active' as const,
  position: 0,
  masteryThresholdPercent: null,
  createdAt: now,
  updatedAt: now,
});

describe('learning-objective coverage API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getLearningObjectiveById.mockResolvedValue(sampleObjective());
    coreMocks.getLearningObjectiveCoverage.mockResolvedValue({
      learningObjectiveId,
      moduleIds: [moduleId],
      unitIds: [],
      pageIds: [],
    });
  });

  it('returns coverage for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.getLearningObjectiveCoverage(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
      ),
    ).resolves.toMatchObject({
      learningObjectiveId,
      moduleIds: [moduleId],
      unitIds: [],
      pageIds: [],
    });
  });

  it('returns coverage for tenant staff without course role', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getLearningObjectiveCoverage(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
      ),
    ).resolves.toMatchObject({ learningObjectiveId });
  });

  it('rejects students with a forbidden error', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.getLearningObjectiveCoverage(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getLearningObjectiveCoverage).not.toHaveBeenCalled();
  });

  it('returns not_found when the objective does not exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getLearningObjectiveById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getLearningObjectiveCoverage(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.getLearningObjectiveCoverage).not.toHaveBeenCalled();
  });

  it('returns not_found when the objective belongs to another course', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getLearningObjectiveById.mockResolvedValue(
      sampleObjective({ courseId: '01J9QW7B6N5W2YH3D3A1V0KE55' }),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.getLearningObjectiveCoverage(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
