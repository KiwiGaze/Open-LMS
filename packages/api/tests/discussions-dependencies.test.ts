import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  tx: {},
  dbHandle: { db: { transaction: vi.fn() } },
  createDbHandle: vi.fn(),
  createDiscussionPost: vi.fn(),
  createDiscussionTopic: vi.fn(),
  getDiscussionTopicForCourse: vi.fn(),
  listDiscussionPostsForTopic: vi.fn(),
  listDiscussionTopicsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveOutboxEvent: vi.fn(),
  subscribeToDiscussionTopic: vi.fn(),
  unsubscribeFromDiscussionTopic: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createDiscussionPost: coreMocks.createDiscussionPost,
    createDiscussionTopic: coreMocks.createDiscussionTopic,
    getDiscussionTopicForCourse: coreMocks.getDiscussionTopicForCourse,
    listDiscussionPostsForTopic: coreMocks.listDiscussionPostsForTopic,
    listDiscussionTopicsForCourse: coreMocks.listDiscussionTopicsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
    subscribeToDiscussionTopic: coreMocks.subscribeToDiscussionTopic,
    unsubscribeFromDiscussionTopic: coreMocks.unsubscribeFromDiscussionTopic,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const otherAuthorUserId = '01J9QW7B6N5W2YH3D3A1V0KE8F';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const postId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const parentPostId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE8B';
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

const configureTopic = (
  visibility: 'draft' | 'published' | 'archived',
  options: { requirePostBeforeSeeingOthers?: boolean } = {},
): void => {
  coreMocks.getDiscussionTopicForCourse.mockResolvedValue({
    id: topicId,
    tenantId,
    courseId,
    moduleId: null,
    unitId: null,
    title: 'Essay workshop',
    prompt: 'Share one paragraph and ask for one specific kind of feedback.',
    visibility,
    position: 0,
    requirePostBeforeSeeingOthers: options.requirePostBeforeSeeingOthers ?? false,
    createdAt: now,
    updatedAt: now,
  });
};

const parentPostMissingError = (): unknown => ({
  code: '23503',
  constraint_name: 'discussion_post_tenant_parent_post_fk',
});

const missingDiscussionTopicCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'discussion_topic_tenant_course_fk',
});

const missingDiscussionTopicPlacementError = (): unknown => ({
  code: '23503',
  constraint_name: 'discussion_topic_tenant_module_unit_fk',
});

describe('discussion API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.dbHandle.db.transaction.mockImplementation(async (callback) =>
      callback(coreMocks.tx),
    );
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listDiscussionTopicsForCourse.mockResolvedValue([]);
    coreMocks.listDiscussionPostsForTopic.mockResolvedValue([]);
    coreMocks.createDiscussionTopic.mockResolvedValue({
      id: topicId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      title: 'Week 2 evidence workshop',
      prompt: 'Share the sentence where your evidence needs the most help.',
      visibility: 'draft',
      position: 2,
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.createDiscussionPost.mockResolvedValue({
      id: postId,
      tenantId,
      topicId,
      authorId: actorUserId,
      parentPostId,
      body: 'I can clarify the evidence in the second sentence.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.saveOutboxEvent.mockImplementation(async (_db, event) => event);
    coreMocks.subscribeToDiscussionTopic.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KE8C',
      tenantId,
      topicId,
      userId: actorUserId,
      createdAt: now,
    });
    coreMocks.unsubscribeFromDiscussionTopic.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
    configureTopic('published');
  });

  it('creates discussion topics for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionTopic(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        title: 'Week 2 evidence workshop',
        prompt: 'Share the sentence where your evidence needs the most help.',
        visibility: 'draft',
        position: 2,
      }),
    ).resolves.toMatchObject({
      id: topicId,
      courseId,
      moduleId,
      unitId,
      title: 'Week 2 evidence workshop',
      visibility: 'draft',
    });

    expect(coreMocks.createDiscussionTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      unitId,
      title: 'Week 2 evidence workshop',
      prompt: 'Share the sentence where your evidence needs the most help.',
      visibility: 'draft',
      position: 2,
    });
  });

  it('allows tenant staff without course membership to create discussion topics', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createDiscussionTopic(actorUserId, tenantId, courseId, {
      moduleId: null,
      unitId: null,
      title: 'Course Q&A',
      prompt: null,
      visibility: 'published',
      position: 0,
    });

    expect(coreMocks.createDiscussionTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      title: 'Course Q&A',
      prompt: null,
      visibility: 'published',
      position: 0,
    });
  });

  it('rejects students creating discussion topics', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionTopic(actorUserId, tenantId, courseId, {
        moduleId: null,
        unitId: null,
        title: 'Course Q&A',
        prompt: null,
        visibility: 'published',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create discussion topics. Ask an instructor for access.',
    });

    expect(coreMocks.createDiscussionTopic).not.toHaveBeenCalled();
  });

  it('maps missing discussion topic courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createDiscussionTopic.mockRejectedValue(missingDiscussionTopicCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionTopic(actorUserId, tenantId, courseId, {
        moduleId: null,
        unitId: null,
        title: 'Course Q&A',
        prompt: null,
        visibility: 'published',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps invalid discussion topic placement to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createDiscussionTopic.mockRejectedValue(missingDiscussionTopicPlacementError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionTopic(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        title: 'Course Q&A',
        prompt: null,
        visibility: 'published',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Discussion topic placement was not found in this course. Check the module and unit ids and retry the request.',
    });
  });

  it('creates discussion posts for visible topics', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionPost(actorUserId, tenantId, courseId, topicId, {
        body: 'I can clarify the evidence in the second sentence.',
        parentPostId,
      }),
    ).resolves.toMatchObject({
      id: postId,
      tenantId,
      topicId,
      authorId: actorUserId,
      parentPostId,
      status: 'published',
    });

    expect(coreMocks.createDiscussionPost).toHaveBeenCalledWith(coreMocks.tx, {
      tenantId,
      topicId,
      authorId: actorUserId,
      parentPostId,
      body: 'I can clarify the evidence in the second sentence.',
      status: 'published',
    });
    expect(coreMocks.subscribeToDiscussionTopic).toHaveBeenCalledWith(coreMocks.tx, {
      tenantId,
      topicId,
      userId: actorUserId,
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
          parentPostId,
          authorId: actorUserId,
        }),
      }),
    );
  });

  it('creates draft discussion posts without reply notifications', async () => {
    coreMocks.createDiscussionPost.mockResolvedValue({
      id: postId,
      tenantId,
      topicId,
      authorId: actorUserId,
      parentPostId,
      body: 'I need to finish this reply later.',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionPost(actorUserId, tenantId, courseId, topicId, {
        body: 'I need to finish this reply later.',
        parentPostId,
        status: 'draft',
      }),
    ).resolves.toMatchObject({
      status: 'draft',
      parentPostId,
    });

    expect(coreMocks.createDiscussionPost).toHaveBeenCalledWith(coreMocks.tx, {
      tenantId,
      topicId,
      authorId: actorUserId,
      parentPostId,
      body: 'I need to finish this reply later.',
      status: 'draft',
    });
    expect(coreMocks.saveOutboxEvent).not.toHaveBeenCalled();
  });

  it('allows course staff to post to draft topics', async () => {
    configureCourseAccess('student', 'instructor');
    configureTopic('draft');
    const dependencies = createDependencies();

    await dependencies.createDiscussionPost(actorUserId, tenantId, courseId, topicId, {
      body: 'This draft prompt is ready for review.',
    });

    expect(coreMocks.createDiscussionPost).toHaveBeenCalledWith(coreMocks.tx, {
      tenantId,
      topicId,
      authorId: actorUserId,
      parentPostId: null,
      body: 'This draft prompt is ready for review.',
      status: 'published',
    });
    expect(coreMocks.subscribeToDiscussionTopic).toHaveBeenCalledWith(coreMocks.tx, {
      tenantId,
      topicId,
      userId: actorUserId,
    });
    expect(coreMocks.saveOutboxEvent).not.toHaveBeenCalled();
  });

  it('lists published posts and the learner author draft', async () => {
    coreMocks.listDiscussionPostsForTopic.mockResolvedValue([
      {
        id: postId,
        tenantId,
        topicId,
        authorId: otherAuthorUserId,
        parentPostId: null,
        body: 'Published post.',
        status: 'published',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE8D',
        tenantId,
        topicId,
        authorId: actorUserId,
        parentPostId: null,
        body: 'My draft.',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE8E',
        tenantId,
        topicId,
        authorId: otherAuthorUserId,
        parentPostId: null,
        body: 'Other draft.',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.listDiscussionPosts(actorUserId, tenantId, courseId, topicId),
    ).resolves.toEqual([
      expect.objectContaining({ status: 'published', authorId: otherAuthorUserId }),
      expect.objectContaining({ status: 'draft', authorId: actorUserId }),
    ]);

    expect(coreMocks.listDiscussionPostsForTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      topicId,
      statuses: ['published', 'draft'],
    });
  });

  it('keeps post-first discussion replies hidden when the learner only has a draft', async () => {
    configureTopic('published', { requirePostBeforeSeeingOthers: true });
    coreMocks.listDiscussionPostsForTopic.mockResolvedValue([
      {
        id: postId,
        tenantId,
        topicId,
        authorId: otherAuthorUserId,
        parentPostId: null,
        body: 'Published post.',
        status: 'published',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE8D',
        tenantId,
        topicId,
        authorId: actorUserId,
        parentPostId: null,
        body: 'My draft.',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.listDiscussionPosts(actorUserId, tenantId, courseId, topicId),
    ).resolves.toEqual([expect.objectContaining({ status: 'draft', authorId: actorUserId })]);
  });

  it('rejects learner posts to draft topics', async () => {
    configureTopic('draft');
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionPost(actorUserId, tenantId, courseId, topicId, {
        body: 'Can I see this draft?',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Discussion topic was not found in this course. Check the topic id and retry the request.',
    });

    expect(coreMocks.createDiscussionPost).not.toHaveBeenCalled();
  });

  it('maps missing parent posts to not found', async () => {
    coreMocks.createDiscussionPost.mockRejectedValue(parentPostMissingError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createDiscussionPost(actorUserId, tenantId, courseId, topicId, {
        body: 'Replying here.',
        parentPostId,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Parent discussion post was not found in this topic. Check the parent post id and retry the request.',
    });
  });

  it('subscribes a learner to a visible discussion topic', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.subscribeToDiscussionTopic(actorUserId, tenantId, courseId, topicId),
    ).resolves.toMatchObject({
      tenantId,
      topicId,
      userId: actorUserId,
    });

    expect(coreMocks.subscribeToDiscussionTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      topicId,
      userId: actorUserId,
    });
  });

  it('unsubscribes a learner from a visible discussion topic', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.unsubscribeFromDiscussionTopic(actorUserId, tenantId, courseId, topicId),
    ).resolves.toBeUndefined();

    expect(coreMocks.unsubscribeFromDiscussionTopic).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      topicId,
      userId: actorUserId,
    });
  });
});
