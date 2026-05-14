import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  tx: {},
  dbHandle: { db: { transaction: vi.fn() } },
  deleteDiscussionPost: vi.fn(),
  getDiscussionPostForTopic: vi.fn(),
  getDiscussionTopicForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveOutboxEvent: vi.fn(),
  updateDiscussionPost: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteDiscussionPost: coreMocks.deleteDiscussionPost,
    getDiscussionPostForTopic: coreMocks.getDiscussionPostForTopic,
    getDiscussionTopicForCourse: coreMocks.getDiscussionTopicForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
    updateDiscussionPost: coreMocks.updateDiscussionPost,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const otherAuthorUserId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const postId = '01J9QW7B6N5W2YH3D3A1V0KE88';
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

const samplePost = (authorId: string) => ({
  id: postId,
  tenantId,
  topicId,
  authorId,
  parentPostId: null,
  body: 'I can clarify the evidence in the second sentence.',
  status: 'published',
  createdAt: now,
  updatedAt: now,
});

const samplePublishedTopic = () => ({
  id: topicId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  title: 'Course Q&A',
  prompt: null,
  visibility: 'published',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const updateInput = { body: 'I can clarify the evidence in the second sentence (edited).' };

describe('discussion post update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.dbHandle.db.transaction.mockImplementation(async (callback) =>
      callback(coreMocks.tx),
    );
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getDiscussionTopicForCourse.mockResolvedValue(samplePublishedTopic());
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(samplePost(actorUserId));
    coreMocks.updateDiscussionPost.mockResolvedValue({
      ...samplePost(actorUserId),
      body: updateInput.body,
    });
    coreMocks.saveOutboxEvent.mockImplementation(async (_db, event) => event);
    coreMocks.deleteDiscussionPost.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('lets the author update their own post', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionPost(
        actorUserId,
        tenantId,
        courseId,
        topicId,
        postId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: postId, body: updateInput.body });

    expect(coreMocks.updateDiscussionPost).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      topicId,
      postId,
      body: updateInput.body,
      status: 'published',
    });
  });

  it('publishes a draft reply and emits the reply event transactionally', async () => {
    coreMocks.getDiscussionPostForTopic.mockResolvedValue({
      ...samplePost(actorUserId),
      parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE89',
      status: 'draft',
    });
    coreMocks.updateDiscussionPost.mockResolvedValue({
      ...samplePost(actorUserId),
      parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE89',
      body: 'Ready to publish.',
      status: 'published',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionPost(actorUserId, tenantId, courseId, topicId, postId, {
        body: 'Ready to publish.',
        status: 'published',
      }),
    ).resolves.toMatchObject({ status: 'published' });

    expect(coreMocks.updateDiscussionPost).toHaveBeenCalledWith(coreMocks.tx, {
      tenantId,
      topicId,
      postId,
      body: 'Ready to publish.',
      status: 'published',
    });
    expect(coreMocks.saveOutboxEvent).toHaveBeenCalledWith(
      coreMocks.tx,
      expect.objectContaining({
        tenantId,
        topic: 'discussion.lifecycle',
        eventType: 'discussion.reply_created',
        payload: expect.objectContaining({
          courseId,
          topicId,
          postId,
          parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE89',
          authorId: actorUserId,
        }),
      }),
    );
  });

  it('lets course staff update any post', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(samplePost(otherAuthorUserId));
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionPost(
        actorUserId,
        tenantId,
        courseId,
        topicId,
        postId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: postId });
  });

  it('forbids non-author non-staff from updating posts', async () => {
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(samplePost(otherAuthorUserId));
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionPost(
        actorUserId,
        tenantId,
        courseId,
        topicId,
        postId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only the author or course staff can modify this discussion post.',
    });

    expect(coreMocks.updateDiscussionPost).not.toHaveBeenCalled();
  });

  it('returns not found when post is missing', async () => {
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionPost(
        actorUserId,
        tenantId,
        courseId,
        topicId,
        postId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Discussion post was not found in this topic. Check the post id and retry the request.',
    });
  });

  it('returns not found when topic is missing', async () => {
    coreMocks.getDiscussionTopicForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateDiscussionPost(
        actorUserId,
        tenantId,
        courseId,
        topicId,
        postId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.getDiscussionPostForTopic).not.toHaveBeenCalled();
  });

  it('lets the author delete their own post', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionPost(actorUserId, tenantId, courseId, topicId, postId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteDiscussionPost).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      topicId,
      postId,
    });
  });

  it('lets course staff delete any post', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(samplePost(otherAuthorUserId));
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionPost(actorUserId, tenantId, courseId, topicId, postId),
    ).resolves.toBeUndefined();
  });

  it('forbids non-author non-staff from deleting posts', async () => {
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(samplePost(otherAuthorUserId));
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionPost(actorUserId, tenantId, courseId, topicId, postId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteDiscussionPost).not.toHaveBeenCalled();
  });

  it('returns not found when deleting missing post', async () => {
    coreMocks.getDiscussionPostForTopic.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteDiscussionPost(actorUserId, tenantId, courseId, topicId, postId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Discussion post was not found in this topic. Check the post id and retry the request.',
    });
  });
});
