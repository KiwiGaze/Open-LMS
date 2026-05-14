import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseCatalogSettings: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseCatalogSettings: coreMocks.updateCourseCatalogSettings,
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

const sampleSettings = () => ({
  tenantId,
  courseId,
  catalogVisibility: 'listed',
  enrollmentCode: 'JOIN-WRIT-101',
  catalogCategory: 'Writing',
  academicTerm: '2026 Fall',
  enrollmentApprovalRequired: true,
  updatedAt: now,
});

describe('course catalog settings API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseCatalogSettings.mockResolvedValue(sampleSettings());
    configureCourseAccess('student', 'student');
  });

  it('updates catalog settings for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCatalogSettings(actorUserId, tenantId, courseId, {
        catalogVisibility: 'listed',
        enrollmentCode: 'JOIN-WRIT-101',
        catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
      enrollmentApprovalRequired: true,
    }),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      catalogVisibility: 'listed',
      enrollmentCode: 'JOIN-WRIT-101',
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
      enrollmentApprovalRequired: true,
    });

    expect(coreMocks.updateCourseCatalogSettings).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      catalogVisibility: 'listed',
      enrollmentCode: 'JOIN-WRIT-101',
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: true,
    });
  });

  it('allows tenant staff without course membership to update catalog settings', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.updateCourseCatalogSettings(actorUserId, tenantId, courseId, {
      catalogVisibility: 'private',
      enrollmentCode: null,
      catalogCategory: null,
      academicTerm: null,
    });

    expect(coreMocks.updateCourseCatalogSettings).toHaveBeenCalledTimes(1);
  });

  it('rejects students changing catalog settings', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCatalogSettings(actorUserId, tenantId, courseId, {
        catalogVisibility: 'listed',
        enrollmentCode: null,
        catalogCategory: null,
        academicTerm: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can change catalog settings. Ask an instructor for access.',
    });

    expect(coreMocks.updateCourseCatalogSettings).not.toHaveBeenCalled();
  });

  it('returns not found when the course does not exist in the tenant', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseCatalogSettings.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCatalogSettings(actorUserId, tenantId, courseId, {
        catalogVisibility: 'listed',
        enrollmentCode: null,
        catalogCategory: null,
        academicTerm: null,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
