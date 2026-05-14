import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteDiscussionTopic: vi.fn(),
  getDiscussionTopicForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateDiscussionTopic: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteDiscussionTopic: coreMocks.deleteDiscussionTopic,
    getDiscussionTopicForCourse: coreMocks.getDiscussionTopicForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateDiscussionTopic: coreMocks.updateDiscussionTopic,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleTopic = () => ({
  id: topicId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  title: 'Course Q&A (updated)',
  prompt: 'Refreshed prompt.',
  visibility: 'published',
  position: 0,
  gradingEnabled: false,
  pointsPossible: null,
  rubricId: null,
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  moduleId: null,
  unitId: null,
  title: 'Course Q&A (updated)',
  prompt: 'Refreshed prompt.',
  visibility: 'published' as const,
  position: 0,
};

describe('discussion topic update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateDiscussionTopic.mockResolvedValue(sampleTopic());
    coreMocks.deleteDiscussionTopic.mockResolvedValue(true);
    coreMocks.getDiscussionTopicForCourse.mockResolvedValue(sampleTopic());
    configureCourseAccess('student', 'student');
  });

  it('updates a discussion topic for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionTopic(actorUserId, tenantId, courseId, topicId, updateInput),
    ).resolves.toMatchObject({ id: topicId, title: 'Course Q&A (updated)' });

    expect(coreMocks.updateDiscussionTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      topicId,
      moduleId: null,
      unitId: null,
      title: 'Course Q&A (updated)',
      prompt: 'Refreshed prompt.',
      visibility: 'published',
      position: 0,
      gradingEnabled: false,
      pointsPossible: null,
      rubricId: null,
    });
  });

  it('returns not found when updating a missing discussion topic', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateDiscussionTopic.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionTopic(actorUserId, tenantId, courseId, topicId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Discussion topic was not found in this course. Check the topic id and retry the request.',
    });
  });

  it('returns bad_request when update placement references missing module', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateDiscussionTopic.mockRejectedValue({
      code: '23503',
      constraint_name: 'discussion_topic_tenant_module_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionTopic(actorUserId, tenantId, courseId, topicId, updateInput),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('rejects students from updating discussion topics', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionTopic(actorUserId, tenantId, courseId, topicId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateDiscussionTopic).not.toHaveBeenCalled();
  });

  it('deletes a discussion topic for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionTopic(actorUserId, tenantId, courseId, topicId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteDiscussionTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      topicId,
    });
  });

  it('returns not found when deleting a missing discussion topic', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteDiscussionTopic.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionTopic(actorUserId, tenantId, courseId, topicId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Discussion topic was not found in this course. Check the topic id and retry the request.',
    });
  });

  it('rejects students from deleting discussion topics', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionTopic(actorUserId, tenantId, courseId, topicId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteDiscussionTopic).not.toHaveBeenCalled();
  });
});
