import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseMembership: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCourseMemberships: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseMembership: coreMocks.createCourseMembership,
    createDbHandle: coreMocks.createDbHandle,
    listCourseMemberships: coreMocks.listCourseMemberships,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const targetUserId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const membershipId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([
    { tenantId, userId: actorUserId, role: tenantRole },
    { tenantId, userId: targetUserId, role: 'student' },
  ]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

describe('course roster CSV API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseMembership.mockResolvedValue({
      id: membershipId,
      tenantId,
      courseId,
      userId: targetUserId,
      role: 'student',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.listCourseMemberships.mockResolvedValue([
      {
        id: membershipId,
        tenantId,
        courseId,
        userId: targetUserId,
        role: 'student',
        status: 'active',
        invitedAt: null,
        acceptedAt: now,
        droppedAt: null,
        withdrawnAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    configureCourseAccess('student', 'instructor');
  });

  it('exports a course roster as CSV for course staff', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.exportCourseRosterCsv(actorUserId, tenantId, courseId)).resolves.toBe(
      [
        'membership_id,user_id,role,status,invited_at,accepted_at,dropped_at,withdrawn_at,created_at,updated_at',
        `${membershipId},${targetUserId},student,active,,2026-05-10T00:00:00.000Z,,,2026-05-10T00:00:00.000Z,2026-05-10T00:00:00.000Z`,
      ].join('\n'),
    );
  });

  it('imports active roster memberships from CSV for course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.importCourseRosterCsv(
        actorUserId,
        tenantId,
        courseId,
        `user_id,role,status\n${targetUserId},student,active\n`,
      ),
    ).resolves.toMatchObject({
      importedCount: 1,
      failedCount: 0,
      results: [{ rowNumber: 2, userId: targetUserId, status: 'imported' }],
    });

    expect(coreMocks.createCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: targetUserId,
      role: 'student',
      status: 'active',
    });
  });
});
