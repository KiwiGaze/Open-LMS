import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createReleaseRule: vi.fn(),
  dbHandle: { db: {} },
  deleteReleaseRule: vi.fn(),
  getAssignmentById: vi.fn(),
  getCoursePageForCourse: vi.fn(),
  getCourseResourceForCourse: vi.fn(),
  listCourseModules: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createReleaseRule: coreMocks.createReleaseRule,
    deleteReleaseRule: coreMocks.deleteReleaseRule,
    getAssignmentById: coreMocks.getAssignmentById,
    getCoursePageForCourse: coreMocks.getCoursePageForCourse,
    getCourseResourceForCourse: coreMocks.getCourseResourceForCourse,
    listCourseModules: coreMocks.listCourseModules,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const ruleId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const pageId = '01J9QW7B6N5W2YH3D3A1V0KE8B';
const now = new Date('2026-05-12T10:00:00Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([
    { tenantId, userId: actorUserId, role: tenantRole },
  ]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, userId: actorUserId, role: courseRole }] : [],
  );
};

describe('module release API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseModules.mockResolvedValue([
      {
        id: moduleId,
        tenantId,
        courseId,
        title: 'Module 1',
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
    coreMocks.getCoursePageForCourse.mockResolvedValue({
      id: pageId,
      tenantId,
      courseId,
      title: 'Overview',
      body: 'Course overview',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [],
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.getAssignmentById.mockResolvedValue({
      id: assignmentId,
      tenantId,
      courseId,
      moduleId,
      title: 'Essay',
      instructions: 'Write an essay.',
      status: 'published',
      dueAt: null,
      allowResubmission: true,
      activeRubricId: null,
      aiSettings: {
        precheckEnabled: false,
        feedbackDraftEnabled: false,
        scoreSuggestionEnabled: false,
      },
      groupSubmissionEnabled: false,
      groupSetId: null,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.createReleaseRule.mockResolvedValue({
      id: ruleId,
      tenantId,
      courseId,
      moduleId,
      targetType: 'course_resource',
      targetId: resourceId,
      ruleType: 'date_after',
      config: { releaseAt: now },
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.deleteReleaseRule.mockResolvedValue(true);
    configureCourseAccess('student', 'instructor');
  });

  it('creates item-scoped release rules for course resources in the module', async () => {
    const dependencies = createDependencies();

    const rule = await dependencies.createModuleReleaseRule(
      actorUserId,
      tenantId,
      courseId,
      moduleId,
      {
        targetType: 'course_resource',
        targetId: resourceId,
        ruleType: 'date_after',
        config: { releaseAt: now },
        position: 0,
        status: 'active',
      },
    );

    expect(rule.targetType).toBe('course_resource');
    expect(coreMocks.createReleaseRule).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      targetType: 'course_resource',
      targetId: resourceId,
      ruleType: 'date_after',
      config: { releaseAt: now },
      position: 0,
      status: 'active',
    });
  });

  it('rejects item-scoped release rules when the target is not in the module', async () => {
    coreMocks.getCourseResourceForCourse.mockResolvedValue({
      id: resourceId,
      tenantId,
      courseId,
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE90',
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
    const dependencies = createDependencies();

    await expect(
      dependencies.createModuleReleaseRule(actorUserId, tenantId, courseId, moduleId, {
        targetType: 'course_resource',
        targetId: resourceId,
        ruleType: 'date_after',
        config: { releaseAt: now },
        position: 0,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Release rule target was not found in this module. Choose a module item and retry.',
    });

    expect(coreMocks.createReleaseRule).not.toHaveBeenCalled();
  });

  it('creates item-scoped release rules for course pages in the course', async () => {
    const dependencies = createDependencies();

    await dependencies.createModuleReleaseRule(actorUserId, tenantId, courseId, moduleId, {
      targetType: 'course_page',
      targetId: pageId,
      ruleType: 'date_after',
      config: { releaseAt: now },
      position: 0,
      status: 'active',
    });

    expect(coreMocks.getCoursePageForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      coursePageId: pageId,
    });
    expect(coreMocks.createReleaseRule).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({ targetType: 'course_page', targetId: pageId }),
    );
  });

  it('creates item-scoped release rules for assignments in the module', async () => {
    const dependencies = createDependencies();

    await dependencies.createModuleReleaseRule(actorUserId, tenantId, courseId, moduleId, {
      targetType: 'assignment',
      targetId: assignmentId,
      ruleType: 'date_after',
      config: { releaseAt: now },
      position: 0,
      status: 'active',
    });

    expect(coreMocks.getAssignmentById).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      assignmentId,
    );
    expect(coreMocks.createReleaseRule).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({ targetType: 'assignment', targetId: assignmentId }),
    );
  });

  it('rejects item-scoped manual unlock release rules', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createModuleReleaseRule(actorUserId, tenantId, courseId, moduleId, {
        targetType: 'assignment',
        targetId: assignmentId,
        ruleType: 'manual_unlock',
        config: { defaultLocked: true },
        position: 0,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Manual unlock release rules can only target modules. Use a date, mastery, or prerequisite rule for module items.',
    });

    expect(coreMocks.createReleaseRule).not.toHaveBeenCalled();
  });

  it('deletes release rules when the rule exists', async () => {
    const dependencies = createDependencies();

    await dependencies.deleteModuleReleaseRule(actorUserId, tenantId, courseId, moduleId, ruleId);

    expect(coreMocks.deleteReleaseRule).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      ruleId,
    });
  });

  it('returns not found when deleting a missing release rule', async () => {
    coreMocks.deleteReleaseRule.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteModuleReleaseRule(actorUserId, tenantId, courseId, moduleId, ruleId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Release rule was not found. Check the rule id and retry the request.',
    });
  });
});
