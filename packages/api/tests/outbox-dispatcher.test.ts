import { OutboxEvent } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchOutboxEvents, readOutboxDispatchLimit } from '../src/outbox-dispatch.ts';

const coreMocks = vi.hoisted(() => ({
  createAnnouncementPublishedNotificationHandler: vi.fn(),
  createDiscussionReplyNotificationHandler: vi.fn(),
  createFeedbackPublishedNotificationHandler: vi.fn(),
  createGradeLifecycleNotificationHandler: vi.fn(),
  createHumanReviewAssignedNotificationHandler: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {}, close: vi.fn() },
  announcementPublishedHandler: vi.fn(),
  discussionReplyHandler: vi.fn(),
  feedbackPublishedHandler: vi.fn(),
  gradeLifecycleHandler: vi.fn(),
  humanReviewAssignedHandler: vi.fn(),
  listPendingOutboxEventsByTopic: vi.fn(),
  markOutboxEventProcessed: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createAnnouncementPublishedNotificationHandler:
      coreMocks.createAnnouncementPublishedNotificationHandler,
    createDiscussionReplyNotificationHandler: coreMocks.createDiscussionReplyNotificationHandler,
    createFeedbackPublishedNotificationHandler:
      coreMocks.createFeedbackPublishedNotificationHandler,
    createGradeLifecycleNotificationHandler: coreMocks.createGradeLifecycleNotificationHandler,
    createHumanReviewAssignedNotificationHandler:
      coreMocks.createHumanReviewAssignedNotificationHandler,
    createDbHandle: coreMocks.createDbHandle,
    listPendingOutboxEventsByTopic: coreMocks.listPendingOutboxEventsByTopic,
    markOutboxEventProcessed: coreMocks.markOutboxEventProcessed,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const now = new Date('2026-05-14T08:30:00.000Z');

const environment = {
  DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  OUTBOX_DISPATCH_LIMIT: '25',
  XAPI_FORWARD_ENDPOINT_URL: 'https://lrs.example.test/xapi/statements',
  XAPI_FORWARD_AUTHORIZATION: 'Bearer xapi-token',
};

const createXapiEvent = () =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: 'integration.xapi',
    eventType: 'xapi.statement_emitted',
    schemaVersion: '1',
    payload: {
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      statementId: 'xapi-statement-1',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      verb: 'completed',
      objectId: 'course-page-1',
    },
    occurredAt: now,
    processedAt: null,
  });

const createGradeLifecycleEvent = () =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: 'grade.lifecycle',
    eventType: 'grade.published',
    schemaVersion: '1',
    payload: {
      gradeId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      score: 9,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      updatedAt: now.toISOString(),
    },
    occurredAt: now,
    processedAt: null,
  });

const createFeedbackPublishedEvent = () =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: 'assignment.feedback',
    eventType: 'feedback.published',
    schemaVersion: '1',
    payload: {
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      publishedFeedbackId: '01J9QW7B6N5W2YH3D3A1V0KE38',
      source: 'manual',
      version: 2,
      linkedGradeId: null,
    },
    occurredAt: now,
    processedAt: null,
  });

const createHumanReviewAssignedEvent = () =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: 'human_review.lifecycle',
    eventType: 'human_review.assigned',
    schemaVersion: '1',
    payload: {
      aiFeedbackDraftId: '01J9QW7B6N5W2YH3D3A1V0KE39',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE3A',
    },
    occurredAt: now,
    processedAt: null,
  });

const createAnnouncementPublishedEvent = () =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: 'announcement.lifecycle',
    eventType: 'announcement.published',
    schemaVersion: '1',
    payload: {
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
      announcementId: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      authorId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
      title: 'Essay workshop reminder',
    },
    occurredAt: now,
    processedAt: null,
  });

const createDiscussionReplyCreatedEvent = () =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: 'discussion.lifecycle',
    eventType: 'discussion.reply_created',
    schemaVersion: '1',
    payload: {
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
      topicId: '01J9QW7B6N5W2YH3D3A1V0KE3D',
      postId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
      parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE3F',
      authorId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
    },
    occurredAt: now,
    processedAt: null,
  });

const createFetch = (response: { ok: boolean; status: number; statusText: string }) =>
  vi.fn().mockResolvedValue(response);

describe('outbox dispatcher worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.dbHandle.close.mockResolvedValue(undefined);
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createAnnouncementPublishedNotificationHandler.mockReturnValue(
      coreMocks.announcementPublishedHandler,
    );
    coreMocks.createDiscussionReplyNotificationHandler.mockReturnValue(
      coreMocks.discussionReplyHandler,
    );
    coreMocks.createGradeLifecycleNotificationHandler.mockReturnValue(
      coreMocks.gradeLifecycleHandler,
    );
    coreMocks.createFeedbackPublishedNotificationHandler.mockReturnValue(
      coreMocks.feedbackPublishedHandler,
    );
    coreMocks.createHumanReviewAssignedNotificationHandler.mockReturnValue(
      coreMocks.humanReviewAssignedHandler,
    );
    coreMocks.announcementPublishedHandler.mockResolvedValue(undefined);
    coreMocks.discussionReplyHandler.mockResolvedValue(undefined);
    coreMocks.gradeLifecycleHandler.mockResolvedValue(undefined);
    coreMocks.feedbackPublishedHandler.mockResolvedValue(undefined);
    coreMocks.humanReviewAssignedHandler.mockResolvedValue(undefined);
    coreMocks.listPendingOutboxEventsByTopic.mockResolvedValue([]);
    coreMocks.markOutboxEventProcessed.mockImplementation(async (_db, _tenantId, id, processedAt) =>
      OutboxEvent.parse({
        ...createXapiEvent(),
        id,
        processedAt,
      }),
    );
  });

  it('dispatches xAPI outbox events to the configured forwarding endpoint', async () => {
    coreMocks.listPendingOutboxEventsByTopic.mockImplementation(
      async (_db, _tenantId, topic: string) =>
        topic === 'integration.xapi' ? [createXapiEvent()] : [],
    );
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchOutboxEvents(environment, { tenantId, now, fetch });

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(coreMocks.listPendingOutboxEventsByTopic).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      'integration.xapi',
      25,
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://lrs.example.test/xapi/statements',
      expect.objectContaining({
        method: 'POST',
        headers: {
          authorization: 'Bearer xapi-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(createXapiEvent().payload),
      }),
    );
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
    expect(coreMocks.dbHandle.close).toHaveBeenCalledTimes(1);
  });

  it('leaves xAPI events skipped when no forwarding endpoint is configured', async () => {
    coreMocks.listPendingOutboxEventsByTopic.mockResolvedValue([]);
    const fetch = createFetch({ ok: true, status: 202, statusText: 'Accepted' });

    const result = await dispatchOutboxEvents(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
      },
      { tenantId, now, fetch },
    );

    expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
    expect(coreMocks.listPendingOutboxEventsByTopic).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      'assignment.feedback',
      50,
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(coreMocks.markOutboxEventProcessed).not.toHaveBeenCalled();
    expect(coreMocks.dbHandle.close).toHaveBeenCalledTimes(1);
  });

  it('dispatches feedback published events to the notification producer without external config', async () => {
    const event = createFeedbackPublishedEvent();
    coreMocks.listPendingOutboxEventsByTopic.mockImplementation(
      async (_db, _tenantId, topic: string) => (topic === 'assignment.feedback' ? [event] : []),
    );

    const result = await dispatchOutboxEvents(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
      },
      { tenantId, now },
    );

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(coreMocks.createFeedbackPublishedNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        getSubmissionById: expect.any(Function),
        getAssignmentById: expect.any(Function),
        listNotificationPreferencesForUser: expect.any(Function),
        saveProducedNotification: expect.any(Function),
      }),
    );
    expect(coreMocks.feedbackPublishedHandler).toHaveBeenCalledWith(event);
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
  });

  it('dispatches grade lifecycle events to the notification producer without external config', async () => {
    const event = createGradeLifecycleEvent();
    coreMocks.listPendingOutboxEventsByTopic.mockImplementation(
      async (_db, _tenantId, topic: string) => (topic === 'grade.lifecycle' ? [event] : []),
    );

    const result = await dispatchOutboxEvents(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
      },
      { tenantId, now },
    );

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(coreMocks.createGradeLifecycleNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        getSubmissionById: expect.any(Function),
        getAssignmentById: expect.any(Function),
        listNotificationPreferencesForUser: expect.any(Function),
        saveProducedNotification: expect.any(Function),
      }),
    );
    expect(coreMocks.gradeLifecycleHandler).toHaveBeenCalledWith(event);
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
  });

  it('dispatches human review assigned events to the notification producer without external config', async () => {
    const event = createHumanReviewAssignedEvent();
    coreMocks.listPendingOutboxEventsByTopic.mockImplementation(
      async (_db, _tenantId, topic: string) => (topic === 'human_review.lifecycle' ? [event] : []),
    );

    const result = await dispatchOutboxEvents(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
      },
      { tenantId, now },
    );

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(coreMocks.createHumanReviewAssignedNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        getSubmissionById: expect.any(Function),
        getAssignmentById: expect.any(Function),
        listNotificationPreferencesForUser: expect.any(Function),
        saveProducedNotification: expect.any(Function),
      }),
    );
    expect(coreMocks.humanReviewAssignedHandler).toHaveBeenCalledWith(event);
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
  });

  it('dispatches announcement published events to the notification producer without external config', async () => {
    const event = createAnnouncementPublishedEvent();
    coreMocks.listPendingOutboxEventsByTopic.mockImplementation(
      async (_db, _tenantId, topic: string) => (topic === 'announcement.lifecycle' ? [event] : []),
    );

    const result = await dispatchOutboxEvents(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
      },
      { tenantId, now },
    );

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(coreMocks.createAnnouncementPublishedNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        listCourseMemberships: expect.any(Function),
        listNotificationPreferencesForUser: expect.any(Function),
        saveProducedNotifications: expect.any(Function),
      }),
    );
    expect(coreMocks.announcementPublishedHandler).toHaveBeenCalledWith(event);
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
  });

  it('dispatches discussion reply events to the notification producer without external config', async () => {
    const event = createDiscussionReplyCreatedEvent();
    coreMocks.listPendingOutboxEventsByTopic.mockImplementation(
      async (_db, _tenantId, topic: string) => (topic === 'discussion.lifecycle' ? [event] : []),
    );

    const result = await dispatchOutboxEvents(
      {
        DATABASE_CONNECTION_STRING: environment.DATABASE_CONNECTION_STRING,
      },
      { tenantId, now },
    );

    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
    expect(coreMocks.createDiscussionReplyNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        getDiscussionTopicForCourse: expect.any(Function),
        listCourseMemberships: expect.any(Function),
        listDiscussionTopicSubscriptions: expect.any(Function),
        listNotificationPreferencesForUser: expect.any(Function),
        saveProducedNotifications: expect.any(Function),
      }),
    );
    expect(coreMocks.discussionReplyHandler).toHaveBeenCalledWith(event);
    expect(coreMocks.markOutboxEventProcessed).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      eventId,
      now,
    );
  });

  it('validates outbox dispatcher limits from the environment', () => {
    expect(readOutboxDispatchLimit({})).toBe(50);
    expect(readOutboxDispatchLimit({ OUTBOX_DISPATCH_LIMIT: '10' })).toBe(10);
    expect(() => readOutboxDispatchLimit({ OUTBOX_DISPATCH_LIMIT: '0' })).toThrow(
      'OUTBOX_DISPATCH_LIMIT must be an integer between 1 and 500.',
    );
    expect(() => readOutboxDispatchLimit({ OUTBOX_DISPATCH_LIMIT: '501' })).toThrow(
      'OUTBOX_DISPATCH_LIMIT must be an integer between 1 and 500.',
    );
  });

  it('requires a database connection string before opening the dispatcher', async () => {
    await expect(dispatchOutboxEvents({}, { tenantId, now })).rejects.toThrow(
      'DATABASE_CONNECTION_STRING is required to dispatch outbox events.',
    );
    expect(coreMocks.createDbHandle).not.toHaveBeenCalled();
  });
});
