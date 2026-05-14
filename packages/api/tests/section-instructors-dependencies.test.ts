import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  assignInstructorToSection: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCourseSectionsForCourse: vi.fn(),
  listSectionInstructorsForSection: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  removeInstructorFromSection: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    assignInstructorToSection: coreMocks.assignInstructorToSection,
    createDbHandle: coreMocks.createDbHandle,
    listCourseSectionsForCourse: coreMocks.listCourseSectionsForCourse,
    listSectionInstructorsForSection: coreMocks.listSectionInstructorsForSection,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    removeInstructorFromSection: coreMocks.removeInstructorFromSection,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const instructorId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const sectionId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const sectionInstructorId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const now = new Date('2026-05-14T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockImplementation((_, requestedUserId: string) => {
    if (requestedUserId === actorUserId) {
      return Promise.resolve(courseRole ? [{ tenantId, courseId, role: courseRole }] : []);
    }
    return Promise.resolve([{ tenantId, courseId, role: 'instructor', status: 'active' }]);
  });
};

const sampleInstructorAssignment = () => ({
  id: sectionInstructorId,
  tenantId,
  courseId,
  sectionId,
  instructorId,
  createdAt: now,
  updatedAt: now,
});

describe('section instructor API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseSectionsForCourse.mockResolvedValue([{ id: sectionId }]);
    coreMocks.listSectionInstructorsForSection.mockResolvedValue([sampleInstructorAssignment()]);
    coreMocks.assignInstructorToSection.mockResolvedValue(sampleInstructorAssignment());
    configureCourseAccess('student', 'instructor');
  });

  it('lists section instructors for course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listSectionInstructors(actorUserId, tenantId, courseId, sectionId),
    ).resolves.toEqual([sampleInstructorAssignment()]);

    expect(coreMocks.listSectionInstructorsForSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      sectionId,
    });
  });

  it('assigns active course staff as section instructors', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.assignSectionInstructor(
        actorUserId,
        tenantId,
        courseId,
        sectionId,
        instructorId,
      ),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      sectionId,
      instructorId,
    });

    expect(coreMocks.assignInstructorToSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      sectionId,
      instructorId,
    });
  });

  it('removes section instructors for course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.removeSectionInstructor(
        actorUserId,
        tenantId,
        courseId,
        sectionId,
        instructorId,
      ),
    ).resolves.toBeUndefined();

    expect(coreMocks.removeInstructorFromSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      sectionId,
      instructorId,
    });
  });

  it('rejects instructor changes for sections outside the course', async () => {
    coreMocks.listCourseSectionsForCourse.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.assignSectionInstructor(
        actorUserId,
        tenantId,
        courseId,
        sectionId,
        instructorId,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Section was not found in this course. Check the section id and retry the request.',
    });

    expect(coreMocks.assignInstructorToSection).not.toHaveBeenCalled();
  });

  it('rejects assigning students as section instructors', async () => {
    coreMocks.listUserCourseMemberships.mockImplementation((_, requestedUserId: string) => {
      if (requestedUserId === actorUserId) {
        return Promise.resolve([{ tenantId, courseId, role: 'instructor' }]);
      }
      return Promise.resolve([{ tenantId, courseId, role: 'student', status: 'active' }]);
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.assignSectionInstructor(
        actorUserId,
        tenantId,
        courseId,
        sectionId,
        instructorId,
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Section instructors must already have an active staff membership in this course. Add the instructor to the course staff before assigning the section.',
    });

    expect(coreMocks.assignInstructorToSection).not.toHaveBeenCalled();
  });

  it('rejects non-staff section instructor changes', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.assignSectionInstructor(
        actorUserId,
        tenantId,
        courseId,
        sectionId,
        instructorId,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only course staff can assign instructors to sections. Ask an instructor for access.',
    });

    expect(coreMocks.assignInstructorToSection).not.toHaveBeenCalled();
  });
});
