import type { CourseRole, TenantRole } from '@openlms/contracts';
import { CourseResourceViewTargetNotFoundError } from '@openlms/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getCourseResourceForCourse: vi.fn(),
  listCourseModules: vi.fn(),
  listLearningObjectiveMasteryForCourse: vi.fn(),
  listReleaseOverridesForStudent: vi.fn(),
  listReleasePoliciesForCourse: vi.fn(),
  listReleaseRulesForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordResourceViewWithCompletion: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getCourseResourceForCourse: coreMocks.getCourseResourceForCourse,
    listCourseModules: coreMocks.listCourseModules,
    listLearningObjectiveMasteryForCourse: coreMocks.listLearningObjectiveMasteryForCourse,
    listReleaseOverridesForStudent: coreMocks.listReleaseOverridesForStudent,
    listReleasePoliciesForCourse: coreMocks.listReleasePoliciesForCourse,
    listReleaseRulesForCourse: coreMocks.listReleaseRulesForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordResourceViewWithCompletion: coreMocks.recordResourceViewWithCompletion,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const ruleId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const now = new Date('2026-05-12T10:00:00Z');

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

describe('resource view API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseResourceForCourse.mockResolvedValue({
      id: resourceId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      resourceType: 'reading_material',
      title: 'Reading',
      body: 'Read this.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [],
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.listCourseModules.mockResolvedValue([
      {
        id: moduleId,
        tenantId,
        courseId,
        title: 'Module',
        summary: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        version: 1,
        position: 0,
        learningObjectiveIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.listLearningObjectiveMasteryForCourse.mockResolvedValue([]);
    coreMocks.listReleaseOverridesForStudent.mockResolvedValue([]);
    coreMocks.listReleasePoliciesForCourse.mockResolvedValue([]);
    coreMocks.listReleaseRulesForCourse.mockResolvedValue([]);
    coreMocks.recordResourceViewWithCompletion.mockResolvedValue({
      id: eventId,
      tenantId,
      courseId,
      resourceId,
      viewerId: actorUserId,
      viewedAt: now,
      createdAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('records a resource view through the completion-aware workflow', async () => {
    const dependencies = createDependencies();

    const event = await dependencies.recordResourceView(
      actorUserId,
      tenantId,
      courseId,
      resourceId,
    );

    expect(event.id).toBe(eventId);
    expect(coreMocks.recordResourceViewWithCompletion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      resourceId,
      viewerId: actorUserId,
      viewedAt: expect.any(Date),
      completeRequirements: true,
    });
  });

  it('records staff views without completing learner requirements', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.recordResourceView(actorUserId, tenantId, courseId, resourceId);

    expect(coreMocks.recordResourceViewWithCompletion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      resourceId,
      viewerId: actorUserId,
      viewedAt: expect.any(Date),
      completeRequirements: false,
    });
  });

  it('rejects users without course access before recording a view', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.recordResourceView(actorUserId, tenantId, courseId, resourceId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.recordResourceViewWithCompletion).not.toHaveBeenCalled();
  });

  it('rejects learner views for locked module resources', async () => {
    coreMocks.getCourseResourceForCourse.mockResolvedValue({
      id: resourceId,
      tenantId,
      courseId,
      moduleId,
      unitId: null,
      resourceType: 'reading_material',
      title: 'Reading',
      body: 'Read this.',
      sourceUri: null,
      visibility: 'published',
      accessPolicy: 'course_member',
      version: 1,
      position: 0,
      learningObjectiveIds: [],
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.listReleaseRulesForCourse.mockResolvedValue([
      {
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        targetType: 'module',
        targetId: null,
        ruleType: 'date_after',
        config: { releaseAt: new Date('2099-01-01T00:00:00.000Z') },
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.recordResourceView(actorUserId, tenantId, courseId, resourceId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course resource was not found in this course. Check the resource id and retry the request.',
    });

    expect(coreMocks.recordResourceViewWithCompletion).not.toHaveBeenCalled();
  });

  it('maps missing resource targets to a not found API error', async () => {
    coreMocks.getCourseResourceForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.recordResourceView(actorUserId, tenantId, courseId, resourceId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course resource was not found in this course. Check the resource id and retry the request.',
    });
  });

  it('maps resource view races to a not found API error', async () => {
    coreMocks.recordResourceViewWithCompletion.mockRejectedValue(
      new CourseResourceViewTargetNotFoundError(),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.recordResourceView(actorUserId, tenantId, courseId, resourceId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course resource was not found in this course. Check the resource id and retry the request.',
    });
  });
});
