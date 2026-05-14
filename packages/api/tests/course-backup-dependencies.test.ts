import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  exportCourseBackup: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    exportCourseBackup: coreMocks.exportCourseBackup,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
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

const sampleBackup = () => ({
  formatVersion: '1',
  exportedAt: now,
  course: {
    id: courseId,
    tenantId,
    code: 'WRIT-101',
    title: 'Evidence-Based Writing',
    status: 'draft',
    startsAt: null,
    endsAt: null,
    catalogVisibility: 'unlisted',
    enrollmentCode: null,
    createdAt: now,
    updatedAt: now,
  },
  learningObjectives: [],
  modules: [],
  units: [],
  pages: [],
  resources: [],
});

describe('course backup export API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.exportCourseBackup.mockResolvedValue(sampleBackup());
    configureCourseAccess('student', 'student');
  });

  it('exports a course backup for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const backup = await dependencies.exportCourseBackup(actorUserId, tenantId, courseId);

    expect(backup.formatVersion).toBe('1');
    expect(backup.course.id).toBe(courseId);
    expect(coreMocks.exportCourseBackup).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('returns not_found when course is missing', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.exportCourseBackup.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.exportCourseBackup(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('rejects students from exporting course backups', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.exportCourseBackup(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.exportCourseBackup).not.toHaveBeenCalled();
  });
});
