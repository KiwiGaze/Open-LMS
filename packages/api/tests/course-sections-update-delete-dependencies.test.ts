import type { CourseRole, CourseSectionMeetingDay, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseSection: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseSection: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseSection: coreMocks.deleteCourseSection,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseSection: coreMocks.updateCourseSection,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const courseSectionId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleSection = () => ({
  id: courseSectionId,
  tenantId,
  courseId,
  name: 'Section B (updated)',
  status: 'archived',
  position: 1,
  meetingDays: ['tuesday', 'thursday'],
  meetingStartTime: '14:00',
  meetingEndTime: '15:15',
  location: 'Lab 3',
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  name: 'Section B (updated)',
  status: 'archived' as const,
  position: 1,
  meetingDays: ['tuesday', 'thursday'] satisfies CourseSectionMeetingDay[],
  meetingStartTime: '14:00',
  meetingEndTime: '15:15',
  location: 'Lab 3',
};

describe('course section update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseSection.mockResolvedValue(sampleSection());
    coreMocks.deleteCourseSection.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a course section for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseSection(
        actorUserId,
        tenantId,
        courseId,
        courseSectionId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: courseSectionId, status: 'archived' });

    expect(coreMocks.updateCourseSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseSectionId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing course section', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseSection.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseSection(
        actorUserId,
        tenantId,
        courseId,
        courseSectionId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course section was not found in this course. Check the section id and retry the request.',
    });
  });

  it('rejects students from updating course sections', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseSection(
        actorUserId,
        tenantId,
        courseId,
        courseSectionId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseSection).not.toHaveBeenCalled();
  });

  it('deletes a course section for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseSection(actorUserId, tenantId, courseId, courseSectionId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseSection).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseSectionId,
    });
  });

  it('returns not found when deleting a missing course section', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseSection.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseSection(actorUserId, tenantId, courseId, courseSectionId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course section was not found in this course. Check the section id and retry the request.',
    });
  });

  it('rejects students from deleting course sections', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseSection(actorUserId, tenantId, courseId, courseSectionId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseSection).not.toHaveBeenCalled();
  });
});
