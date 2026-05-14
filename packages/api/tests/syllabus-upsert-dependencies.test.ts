import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  upsertCourseSyllabus: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    upsertCourseSyllabus: coreMocks.upsertCourseSyllabus,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const syllabusId = '01J9QW7B6N5W2YH3D3A1V0KE82';
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

const missingCourseSyllabusCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_syllabus_tenant_course_fk',
});

describe('course syllabus upsert API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.upsertCourseSyllabus.mockResolvedValue({
      id: syllabusId,
      tenantId,
      courseId,
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('upserts syllabus for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertCourseSyllabus(actorUserId, tenantId, courseId, {
        body: 'Course policies, grading expectations, and weekly rhythm.',
        visibility: 'published',
      }),
    ).resolves.toMatchObject({
      id: syllabusId,
      courseId,
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 1,
    });

    expect(coreMocks.upsertCourseSyllabus).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
    });
  });

  it('allows tenant staff without course membership to upsert syllabus', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.upsertCourseSyllabus(actorUserId, tenantId, courseId, {
      body: 'Draft syllabus under review.',
      visibility: 'draft',
    });

    expect(coreMocks.upsertCourseSyllabus).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      body: 'Draft syllabus under review.',
      visibility: 'draft',
    });
  });

  it('rejects students upserting syllabus', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertCourseSyllabus(actorUserId, tenantId, courseId, {
        body: 'Course policies, grading expectations, and weekly rhythm.',
        visibility: 'published',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can update the syllabus. Ask an instructor for access.',
    });

    expect(coreMocks.upsertCourseSyllabus).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.upsertCourseSyllabus.mockRejectedValue(missingCourseSyllabusCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertCourseSyllabus(actorUserId, tenantId, courseId, {
        body: 'Course policies, grading expectations, and weekly rhythm.',
        visibility: 'published',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('returns the bumped version when the syllabus already exists', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.upsertCourseSyllabus.mockResolvedValue({
      id: syllabusId,
      tenantId,
      courseId,
      body: 'Revised: course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 3,
      createdAt: now,
      updatedAt: new Date('2026-05-12T00:00:00.000Z'),
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertCourseSyllabus(actorUserId, tenantId, courseId, {
        body: 'Revised: course policies, grading expectations, and weekly rhythm.',
        visibility: 'published',
      }),
    ).resolves.toMatchObject({
      id: syllabusId,
      version: 3,
    });
  });
});
