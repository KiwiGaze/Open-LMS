import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCredentialAward: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getCredentialForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCredentialAward: coreMocks.createCredentialAward,
    createDbHandle: coreMocks.createDbHandle,
    getCredentialForCourse: coreMocks.getCredentialForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const credentialId = '01J9QW7B6N5W2YH3D3A1V0KE4R';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE8P';
const awardId = '01J9QW7B6N5W2YH3D3A1V0KE4S';
const issuedAt = new Date('2026-05-10T00:00:00.000Z');
const expiresAt = new Date('2027-05-10T00:00:00.000Z');
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

const sampleCredential = () => ({
  id: credentialId,
  tenantId,
  courseId,
  credentialType: 'badge',
  title: 'Evidence-based writing badge',
  description: null,
  criteriaSummary: 'Earn 85% on three essay rubrics.',
  status: 'published',
  imageUrl: null,
  createdAt: now,
  updatedAt: now,
});

const duplicateAwardError = (): unknown => ({
  code: '23505',
  constraint_name: 'credential_award_tenant_credential_student_uq',
});

describe('credential award creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCredentialForCourse.mockResolvedValue(sampleCredential());
    coreMocks.createCredentialAward.mockResolvedValue({
      id: awardId,
      tenantId,
      credentialId,
      studentId,
      status: 'issued',
      issuedAt,
      revokedAt: null,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('awards credentials for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCredentialAward(actorUserId, tenantId, courseId, credentialId, {
        studentId,
        status: 'issued',
        issuedAt,
        revokedAt: null,
        expiresAt,
      }),
    ).resolves.toMatchObject({
      id: awardId,
      credentialId,
      studentId,
      status: 'issued',
    });

    expect(coreMocks.createCredentialAward).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      credentialId,
      studentId,
      status: 'issued',
      issuedAt,
      revokedAt: null,
      expiresAt,
    });
  });

  it('allows tenant staff without course membership to award credentials', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCredentialAward(actorUserId, tenantId, courseId, credentialId, {
      studentId,
      status: 'issued',
      issuedAt,
      revokedAt: null,
      expiresAt: null,
    });

    expect(coreMocks.createCredentialAward).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      credentialId,
      studentId,
      status: 'issued',
      issuedAt,
      revokedAt: null,
      expiresAt: null,
    });
  });

  it('rejects students awarding credentials', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCredentialAward(actorUserId, tenantId, courseId, credentialId, {
        studentId,
        status: 'issued',
        issuedAt,
        revokedAt: null,
        expiresAt: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can award credentials. Ask an instructor for access.',
    });

    expect(coreMocks.createCredentialAward).not.toHaveBeenCalled();
  });

  it('returns not found when the credential does not belong to the course', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getCredentialForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createCredentialAward(actorUserId, tenantId, courseId, credentialId, {
        studentId,
        status: 'issued',
        issuedAt,
        revokedAt: null,
        expiresAt: null,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Credential was not found in this course. Check the credential id and retry the request.',
    });

    expect(coreMocks.createCredentialAward).not.toHaveBeenCalled();
  });

  it('maps duplicate awards to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCredentialAward.mockRejectedValue(duplicateAwardError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCredentialAward(actorUserId, tenantId, courseId, credentialId, {
        studentId,
        status: 'issued',
        issuedAt,
        revokedAt: null,
        expiresAt: null,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Student already has an award for this credential. Revoke the existing award before awarding again.',
    });
  });
});
