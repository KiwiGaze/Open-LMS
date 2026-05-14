import { type CourseRole, CourseSyllabus, type TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getCourseSyllabusForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getCourseSyllabusForCourse: coreMocks.getCourseSyllabusForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE8C';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE8D';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE8E';
const now = new Date('2026-05-10T00:00:00.000Z');

const syllabus = CourseSyllabus.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE8F',
  tenantId,
  courseId,
  body: 'Course policies, grading expectations, and weekly rhythm.',
  visibility: 'published',
  version: 1,
  createdAt: now,
  updatedAt: now,
});

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

describe('course syllabus API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseSyllabusForCourse.mockResolvedValue(syllabus);
    configureCourseAccess('student', 'student');
  });

  it('returns a published syllabus for ordinary course members', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.getCourseSyllabus(actorUserId, tenantId, courseId)).resolves.toEqual(
      syllabus,
    );

    expect(coreMocks.getCourseSyllabusForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('hides draft syllabi from ordinary course members', async () => {
    coreMocks.getCourseSyllabusForCourse.mockResolvedValue({
      ...syllabus,
      visibility: 'draft',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseSyllabus(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course syllabus was not found. Check the course id and retry the request.',
    });
  });

  it('returns draft syllabi for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const draftSyllabus = CourseSyllabus.parse({ ...syllabus, visibility: 'draft' });
    coreMocks.getCourseSyllabusForCourse.mockResolvedValue(draftSyllabus);
    const dependencies = createDependencies();

    await expect(dependencies.getCourseSyllabus(actorUserId, tenantId, courseId)).resolves.toEqual(
      draftSyllabus,
    );
  });

  it('rejects tenant members without course access before reading the syllabus', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getCourseSyllabus(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.getCourseSyllabusForCourse).not.toHaveBeenCalled();
  });
});
