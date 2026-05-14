import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseCredential: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseCredential: coreMocks.createCourseCredential,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const credentialId = '01J9QW7B6N5W2YH3D3A1V0KE4R';
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

const missingCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_credential_tenant_course_fk',
});

describe('course credential creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseCredential.mockResolvedValue({
      id: credentialId,
      tenantId,
      courseId,
      credentialType: 'badge',
      title: 'Evidence-based writing badge',
      description: 'Awarded for sustained evidence-based argumentation.',
      criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
      status: 'draft',
      imageUrl: 'https://images.example.test/badges/evidence-writing.png',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates credentials for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseCredential(actorUserId, tenantId, courseId, {
        credentialType: 'badge',
        title: 'Evidence-based writing badge',
        description: 'Awarded for sustained evidence-based argumentation.',
        criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
        status: 'draft',
        imageUrl: 'https://images.example.test/badges/evidence-writing.png',
      }),
    ).resolves.toMatchObject({
      id: credentialId,
      courseId,
      credentialType: 'badge',
      title: 'Evidence-based writing badge',
      status: 'draft',
    });

    expect(coreMocks.createCourseCredential).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      credentialType: 'badge',
      title: 'Evidence-based writing badge',
      description: 'Awarded for sustained evidence-based argumentation.',
      criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
      status: 'draft',
      imageUrl: 'https://images.example.test/badges/evidence-writing.png',
    });
  });

  it('allows tenant staff without course membership to create credentials without an image', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseCredential(actorUserId, tenantId, courseId, {
      credentialType: 'certificate',
      title: 'Course completion certificate',
      description: null,
      criteriaSummary: 'Complete every published module.',
      status: 'published',
      imageUrl: null,
    });

    expect(coreMocks.createCourseCredential).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      credentialType: 'certificate',
      title: 'Course completion certificate',
      description: null,
      criteriaSummary: 'Complete every published module.',
      status: 'published',
      imageUrl: null,
    });
  });

  it('rejects students creating credentials', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseCredential(actorUserId, tenantId, courseId, {
        credentialType: 'badge',
        title: 'Evidence-based writing badge',
        description: null,
        criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
        status: 'draft',
        imageUrl: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create credentials. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseCredential).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseCredential.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseCredential(actorUserId, tenantId, courseId, {
        credentialType: 'badge',
        title: 'Evidence-based writing badge',
        description: null,
        criteriaSummary: 'Earn 85% or higher on at least three essay rubrics.',
        status: 'draft',
        imageUrl: null,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
