import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createCourseSection: vi.fn(),
  createDbHandle: vi.fn(),
  listCourseSectionsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseSection: coreMocks.createCourseSection,
    createDbHandle: coreMocks.createDbHandle,
    listCourseSectionsForCourse: coreMocks.listCourseSectionsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const sectionId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const missingCourseSectionError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_section_tenant_course_fk',
});

describe('course section API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseSectionsForCourse.mockResolvedValue([]);
    coreMocks.createCourseSection.mockResolvedValue({
      id: sectionId,
      tenantId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
      meetingDays: ['monday', 'wednesday'],
      meetingStartTime: '09:30',
      meetingEndTime: '10:45',
      location: 'Room 204',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates course sections for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseSection(actorUserId, tenantId, courseId, {
        name: 'Section B',
        status: 'active',
        position: 1,
        meetingDays: ['monday', 'wednesday'],
        meetingStartTime: '09:30',
        meetingEndTime: '10:45',
        location: 'Room 204',
      }),
    ).resolves.toMatchObject({
      id: sectionId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
    });

    expect(coreMocks.createCourseSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
      meetingDays: ['monday', 'wednesday'],
      meetingStartTime: '09:30',
      meetingEndTime: '10:45',
      location: 'Room 204',
    });
  });

  it('allows tenant staff without course membership to create sections', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseSection(actorUserId, tenantId, courseId, {
      name: 'Archived cohort',
      status: 'archived',
      position: 2,
      meetingDays: [],
      meetingStartTime: null,
      meetingEndTime: null,
      location: null,
    });

    expect(coreMocks.createCourseSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Archived cohort',
      status: 'archived',
      position: 2,
      meetingDays: [],
      meetingStartTime: null,
      meetingEndTime: null,
      location: null,
    });
  });

  it('rejects students creating course sections', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseSection(actorUserId, tenantId, courseId, {
        name: 'Section B',
        status: 'active',
        position: 1,
        meetingDays: [],
        meetingStartTime: null,
        meetingEndTime: null,
        location: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course sections. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseSection).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseSection.mockRejectedValue(missingCourseSectionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseSection(actorUserId, tenantId, courseId, {
        name: 'Section B',
        status: 'active',
        position: 1,
        meetingDays: [],
        meetingStartTime: null,
        meetingEndTime: null,
        location: null,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
