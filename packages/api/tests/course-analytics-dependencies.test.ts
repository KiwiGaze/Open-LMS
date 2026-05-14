import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getCourseAnalyticsSummary: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getCourseAnalyticsSummary: coreMocks.getCourseAnalyticsSummary,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';

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

const sampleSummary = () => ({
  enrolledStudents: 24,
  publishedAssignments: 5,
  publishedQuizzes: 3,
  publishedCalendarEvents: 8,
  publishedDiscussionTopics: 2,
  totalSubmissions: 100,
});

describe('course analytics summary API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseAnalyticsSummary.mockResolvedValue(sampleSummary());
    configureCourseAccess('student', 'student');
  });

  it('returns summary for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const summary = await dependencies.getCourseAnalyticsSummary(actorUserId, tenantId, courseId);

    expect(summary).toMatchObject({
      enrolledStudents: 24,
      publishedAssignments: 5,
      totalSubmissions: 100,
    });
    expect(coreMocks.getCourseAnalyticsSummary).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('returns summary for tenant admin', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseAnalyticsSummary(actorUserId, tenantId, courseId),
    ).resolves.toMatchObject({ enrolledStudents: 24 });
  });

  it('rejects students from viewing analytics', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseAnalyticsSummary(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getCourseAnalyticsSummary).not.toHaveBeenCalled();
  });
});
