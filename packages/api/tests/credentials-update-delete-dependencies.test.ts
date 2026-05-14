import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseCredential: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseCredential: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseCredential: coreMocks.deleteCourseCredential,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseCredential: coreMocks.updateCourseCredential,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const credentialId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleCredential = () => ({
  id: credentialId,
  tenantId,
  courseId,
  credentialType: 'badge',
  title: 'Evidence-based writing badge (updated)',
  description: 'Refreshed description.',
  criteriaSummary: 'Earn 90% or higher on at least three essay rubrics.',
  status: 'published',
  imageUrl: null,
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  credentialType: 'badge' as const,
  title: 'Evidence-based writing badge (updated)',
  description: 'Refreshed description.',
  criteriaSummary: 'Earn 90% or higher on at least three essay rubrics.',
  status: 'published' as const,
  imageUrl: null,
};

describe('course credential update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseCredential.mockResolvedValue(sampleCredential());
    coreMocks.deleteCourseCredential.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a course credential for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCredential(
        actorUserId,
        tenantId,
        courseId,
        credentialId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: credentialId, status: 'published' });

    expect(coreMocks.updateCourseCredential).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      credentialId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing credential', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseCredential.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCredential(
        actorUserId,
        tenantId,
        courseId,
        credentialId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Credential was not found in this course. Check the credential id and retry the request.',
    });
  });

  it('rejects students from updating credentials', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseCredential(
        actorUserId,
        tenantId,
        courseId,
        credentialId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseCredential).not.toHaveBeenCalled();
  });

  it('deletes a course credential for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseCredential(actorUserId, tenantId, courseId, credentialId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseCredential).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      credentialId,
    });
  });

  it('returns not found when deleting a missing credential', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseCredential.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseCredential(actorUserId, tenantId, courseId, credentialId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Credential was not found in this course. Check the credential id and retry the request.',
    });
  });

  it('rejects students from deleting credentials', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseCredential(actorUserId, tenantId, courseId, credentialId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseCredential).not.toHaveBeenCalled();
  });
});
