import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getScormAttemptForStudent: vi.fn(),
  getScormPackageForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  upsertScormAttempt: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getScormAttemptForStudent: coreMocks.getScormAttemptForStudent,
    getScormPackageForCourse: coreMocks.getScormPackageForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    upsertScormAttempt: coreMocks.upsertScormAttempt,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE78';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const scormPackageId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const attemptId = '01J9QW7B6N5W2YH3D3A1V0KE77';
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

const samplePackage = (status: 'draft' | 'published' | 'archived' = 'published') => ({
  id: scormPackageId,
  tenantId,
  courseId,
  title: 'Intro SCO',
  scormVersion: '1.2' as const,
  launchUrl: 'https://cdn.example.com/scorm/index.html',
  manifest: { schemaVersion: '1.2' },
  status,
  createdAt: now,
  updatedAt: now,
});

const sampleAttempt = (overrides: Record<string, unknown> = {}) => ({
  id: attemptId,
  tenantId,
  scormPackageId,
  studentId: actorUserId,
  completionStatus: 'incomplete' as const,
  successStatus: 'unknown' as const,
  scoreScaled: null,
  totalTimeSeconds: null,
  suspendData: null,
  lastVisitedAt: now,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('SCORM runtime API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getScormPackageForCourse.mockResolvedValue(samplePackage());
    coreMocks.getScormAttemptForStudent.mockResolvedValue(sampleAttempt());
    coreMocks.upsertScormAttempt.mockResolvedValue(sampleAttempt());
    configureCourseAccess('student', 'student');
  });

  it('initializes a SCORM runtime attempt for an active course member', async () => {
    coreMocks.getScormAttemptForStudent.mockResolvedValue(null);
    const dependencies = createDependencies();

    const state = await dependencies.initializeScormRuntime(
      actorUserId,
      tenantId,
      courseId,
      scormPackageId,
    );

    expect(coreMocks.getScormPackageForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      scormPackageId,
    });
    expect(coreMocks.upsertScormAttempt).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      scormPackageId,
      studentId: actorUserId,
      completionStatus: 'incomplete',
      successStatus: 'unknown',
      scoreScaled: null,
      totalTimeSeconds: null,
      suspendData: null,
      lastVisitedAt: expect.any(Date),
    });
    expect(state.values['cmi.core.lesson_status']).toBe('incomplete');
  });

  it('commits SCORM runtime values to the attempt store', async () => {
    coreMocks.getScormAttemptForStudent.mockResolvedValue(sampleAttempt({ totalTimeSeconds: 60 }));
    coreMocks.upsertScormAttempt.mockResolvedValue(
      sampleAttempt({
        completionStatus: 'completed',
        successStatus: 'passed',
        scoreScaled: 0.87,
        totalTimeSeconds: 810,
        suspendData: 'bookmark=section-2',
      }),
    );
    const dependencies = createDependencies();

    const state = await dependencies.commitScormRuntime(
      actorUserId,
      tenantId,
      courseId,
      scormPackageId,
      {
        values: {
          'cmi.core.lesson_status': 'passed',
          'cmi.core.score.raw': '87',
          'cmi.core.session_time': '0000:12:30.00',
          'cmi.suspend_data': 'bookmark=section-2',
        },
      },
    );

    expect(coreMocks.upsertScormAttempt).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      scormPackageId,
      studentId: actorUserId,
      completionStatus: 'completed',
      successStatus: 'passed',
      scoreScaled: 0.87,
      totalTimeSeconds: 810,
      suspendData: 'bookmark=section-2',
      lastVisitedAt: expect.any(Date),
    });
    expect(state.values['cmi.core.total_time']).toBe('0000:13:30.00');
  });

  it('rejects runtime access to unpublished SCORM packages for students', async () => {
    coreMocks.getScormPackageForCourse.mockResolvedValue(samplePackage('draft'));
    const dependencies = createDependencies();

    await expect(
      dependencies.initializeScormRuntime(actorUserId, tenantId, courseId, scormPackageId),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.upsertScormAttempt).not.toHaveBeenCalled();
  });

  it('rejects direct SCORM attempt writes when the package is outside the course path', async () => {
    coreMocks.getScormPackageForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertScormAttempt(actorUserId, tenantId, courseId, scormPackageId, {
        completionStatus: 'completed',
        successStatus: 'passed',
        scoreScaled: 0.87,
        totalTimeSeconds: 750,
        suspendData: 'bookmark=section-2',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.upsertScormAttempt).not.toHaveBeenCalled();
  });
});
