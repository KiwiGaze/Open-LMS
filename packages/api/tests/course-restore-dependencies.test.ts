import { CourseBackup, type TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
  restoreCourseBackup: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    restoreCourseBackup: coreMocks.restoreCourseBackup,
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

const configureTenantAccess = (role: TenantRole): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role }]);
};

const sampleBackup = () =>
  CourseBackup.parse({
    formatVersion: '1',
    exportedAt: now,
    course: {
      id: '01J9QW7B6N5W2YH3D3A1V0KE99',
      tenantId,
      code: 'WRIT-100',
      title: 'Source course',
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

describe('course restore API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.restoreCourseBackup.mockResolvedValue({
      learningObjectivesRestored: 0,
      modulesRestored: 0,
      unitsRestored: 0,
      pagesRestored: 0,
      resourcesRestored: 0,
    });
    configureTenantAccess('student');
  });

  it('restores a backup for tenant staff', async () => {
    configureTenantAccess('institution_admin');
    const dependencies = createDependencies();

    const result = await dependencies.restoreCourseBackup(actorUserId, tenantId, courseId, {
      backup: sampleBackup(),
    });

    expect(result.learningObjectivesRestored).toBe(0);
    expect(coreMocks.restoreCourseBackup).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      targetCourseId: courseId,
      backup: sampleBackup(),
    });
  });

  it('rejects students from restoring course backups', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreCourseBackup(actorUserId, tenantId, courseId, {
        backup: sampleBackup(),
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.restoreCourseBackup).not.toHaveBeenCalled();
  });

  it('maps version errors to bad_request', async () => {
    configureTenantAccess('institution_admin');
    const { CourseRestoreVersionError } = await import('@openlms/core');
    coreMocks.restoreCourseBackup.mockRejectedValue(
      new CourseRestoreVersionError('Unsupported backup formatVersion: 2'),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreCourseBackup(actorUserId, tenantId, courseId, {
        backup: sampleBackup(),
      }),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('maps target-missing errors to not_found', async () => {
    configureTenantAccess('institution_admin');
    const { CourseRestoreTargetMissingError } = await import('@openlms/core');
    coreMocks.restoreCourseBackup.mockRejectedValue(
      new CourseRestoreTargetMissingError('Target course was not found in this tenant.'),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreCourseBackup(actorUserId, tenantId, courseId, {
        backup: sampleBackup(),
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
