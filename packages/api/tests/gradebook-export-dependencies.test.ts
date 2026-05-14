import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listGradebookEntriesForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listGradebookEntriesForCourse: coreMocks.listGradebookEntriesForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const dueAt = new Date('2026-05-10T00:00:00.000Z');
const submittedAt = new Date('2026-05-09T00:00:00.000Z');
const gradedAt = new Date('2026-05-11T00:00:00.000Z');

const sampleEntry = {
  id: `gradebook_entry:${gradeId}`,
  tenantId,
  courseId,
  assignmentId,
  assignmentTitle: 'Essay 1',
  assignmentDueAt: dueAt,
  gradebookCategoryId: null,
  gradebookCategoryName: null,
  studentId,
  submissionId,
  submittedAt,
  gradeId,
  score: 9,
  maxScore: 10,
  gradeStatus: 'published' as const,
  gradeSource: 'manual' as const,
  gradedAt,
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

describe('gradebook CSV export API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listGradebookEntriesForCourse.mockResolvedValue([sampleEntry]);
  });

  it('returns CSV for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const csv = await dependencies.exportGradebookCsv(actorUserId, tenantId, courseId);
    const lines = csv.split('\n');

    expect(lines[0]).toContain('assignment_id');
    expect(lines[0]).toContain('max_score');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(assignmentId);
    expect(lines[1]).toContain(studentId);
    expect(lines[1]).toContain('9,10,published,manual');

    expect(coreMocks.listGradebookEntriesForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({ tenantId, courseId }),
    );
  });

  it('returns CSV for tenant staff even without a course role', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    const csv = await dependencies.exportGradebookCsv(actorUserId, tenantId, courseId);

    expect(csv.split('\n')).toHaveLength(2);
  });

  it('rejects students from exporting the gradebook', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.exportGradebookCsv(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listGradebookEntriesForCourse).not.toHaveBeenCalled();
  });

  it('returns header-only CSV when there are no gradebook entries', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listGradebookEntriesForCourse.mockResolvedValue([]);
    const dependencies = createDependencies();

    const csv = await dependencies.exportGradebookCsv(actorUserId, tenantId, courseId);

    expect(csv.split('\n')).toHaveLength(1);
    expect(csv.split('\n')[0]).toContain('assignment_id');
  });
});
