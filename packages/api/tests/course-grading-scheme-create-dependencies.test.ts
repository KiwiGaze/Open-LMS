import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseGradingScheme: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseGradingScheme: coreMocks.createCourseGradingScheme,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const schemeId = '01J9QW7B6N5W2YH3D3A1V0KE8Q';
const now = new Date('2026-05-10T00:00:00.000Z');

const sampleEntries = [
  { label: 'A', minPercent: 90 },
  { label: 'B', minPercent: 80 },
  { label: 'C', minPercent: 70 },
  { label: 'F', minPercent: 0 },
];

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
  constraint_name: 'course_grading_scheme_tenant_course_fk',
});

const duplicateNameError = (): unknown => ({
  code: '23505',
  constraint_name: 'course_grading_scheme_tenant_course_name_uq',
});

describe('course grading scheme creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseGradingScheme.mockResolvedValue({
      id: schemeId,
      tenantId,
      courseId,
      name: 'Standard 4-tier',
      status: 'active',
      entries: sampleEntries,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates grading schemes for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGradingScheme(actorUserId, tenantId, courseId, {
        name: 'Standard 4-tier',
        status: 'active',
        entries: sampleEntries,
      }),
    ).resolves.toMatchObject({
      id: schemeId,
      courseId,
      name: 'Standard 4-tier',
      status: 'active',
    });

    expect(coreMocks.createCourseGradingScheme).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Standard 4-tier',
      status: 'active',
      entries: sampleEntries,
    });
  });

  it('allows tenant staff without course membership to create grading schemes', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseGradingScheme(actorUserId, tenantId, courseId, {
      name: 'Pass/Fail',
      status: 'active',
      entries: [
        { label: 'Pass', minPercent: 60 },
        { label: 'Fail', minPercent: 0 },
      ],
    });

    expect(coreMocks.createCourseGradingScheme).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Pass/Fail',
      status: 'active',
      entries: [
        { label: 'Pass', minPercent: 60 },
        { label: 'Fail', minPercent: 0 },
      ],
    });
  });

  it('rejects students creating grading schemes', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGradingScheme(actorUserId, tenantId, courseId, {
        name: 'Standard 4-tier',
        status: 'active',
        entries: sampleEntries,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create grading schemes. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseGradingScheme).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseGradingScheme.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGradingScheme(actorUserId, tenantId, courseId, {
        name: 'Standard 4-tier',
        status: 'active',
        entries: sampleEntries,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps duplicate names to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseGradingScheme.mockRejectedValue(duplicateNameError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGradingScheme(actorUserId, tenantId, courseId, {
        name: 'Standard 4-tier',
        status: 'active',
        entries: sampleEntries,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Grading scheme name already exists in this course. Choose a unique name and retry the request.',
    });
  });
});
