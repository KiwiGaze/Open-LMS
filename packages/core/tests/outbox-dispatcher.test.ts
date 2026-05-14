import {
  Assignment,
  CourseMembership,
  DiscussionTopic,
  DiscussionTopicSubscription,
  OutboxEvent,
  Submission,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  createAnnouncementPublishedNotificationHandler,
  createDiscussionReplyNotificationHandler,
  createFeedbackPublishedNotificationHandler,
  createGradeLifecycleNotificationHandler,
  createHumanReviewAssignedNotificationHandler,
  createXapiForwardingHandler,
  dispatchOutboxEventBatch,
} from '../src/events/outbox-dispatcher.ts';

const now = new Date('2026-05-14T08:00:00.000Z');
const processedAt = new Date('2026-05-14T08:01:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE2V';

const createEvent = (input?: {
  topic?: string;
  eventType?: string;
  payload?: Record<string, unknown>;
}) =>
  OutboxEvent.parse({
    id: eventId,
    tenantId,
    topic: input?.topic ?? 'integration.xapi',
    eventType: input?.eventType ?? 'xapi.statement_emitted',
    schemaVersion: '1',
    payload: input?.payload ?? {
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      statementId: 'xapi-statement-1',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      verb: 'completed',
      objectId: 'course-page-1',
    },
    occurredAt: now,
    processedAt: null,
  });

const createGradeLifecycleEvent = (input?: { status?: string }) =>
  createEvent({
    topic: 'grade.lifecycle',
    eventType: 'grade.published',
    payload: {
      gradeId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      score: 9,
      maxScore: 10,
      status: input?.status ?? 'published',
      source: 'manual',
      updatedAt: now.toISOString(),
    },
  });

const createFeedbackPublishedEvent = () =>
  createEvent({
    topic: 'assignment.feedback',
    eventType: 'feedback.published',
    payload: {
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      publishedFeedbackId: '01J9QW7B6N5W2YH3D3A1V0KE38',
      source: 'manual',
      version: 2,
      linkedGradeId: null,
    },
  });

const createHumanReviewAssignedEvent = () =>
  createEvent({
    topic: 'human_review.lifecycle',
    eventType: 'human_review.assigned',
    payload: {
      aiFeedbackDraftId: '01J9QW7B6N5W2YH3D3A1V0KE39',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE3A',
    },
  });

const createAnnouncementPublishedEvent = () =>
  createEvent({
    topic: 'announcement.lifecycle',
    eventType: 'announcement.published',
    payload: {
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
      announcementId: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      authorId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
      title: 'Essay workshop reminder',
    },
  });

const createDiscussionReplyCreatedEvent = () =>
  createEvent({
    topic: 'discussion.lifecycle',
    eventType: 'discussion.reply_created',
    payload: {
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
      topicId: '01J9QW7B6N5W2YH3D3A1V0KE3H',
      postId: '01J9QW7B6N5W2YH3D3A1V0KE3J',
      parentPostId: '01J9QW7B6N5W2YH3D3A1V0KE3K',
      authorId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
    },
  });

describe('outbox dispatcher', () => {
  it('dispatches handled outbox events and marks them processed after handler success', async () => {
    const event = createEvent();
    const handler = vi.fn().mockResolvedValue(undefined);
    const listPendingOutboxEventsByTopic = vi.fn().mockResolvedValue([event]);
    const markOutboxEventProcessed = vi.fn().mockImplementation(async () => ({
      ...event,
      processedAt,
    }));

    const result = await dispatchOutboxEventBatch(
      {
        listPendingOutboxEventsByTopic,
        markOutboxEventProcessed,
        handlers: {
          'integration.xapi': handler,
        },
      },
      { tenantId, limit: 10, now: processedAt },
    );

    expect(listPendingOutboxEventsByTopic).toHaveBeenCalledWith(tenantId, 'integration.xapi', 10);
    expect(handler).toHaveBeenCalledWith(event);
    expect(markOutboxEventProcessed).toHaveBeenCalledWith(tenantId, eventId, processedAt);
    expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
  });

  it('leaves handler failures unprocessed so the event can be retried', async () => {
    const event = createEvent();
    const markOutboxEventProcessed = vi.fn();

    const result = await dispatchOutboxEventBatch(
      {
        listPendingOutboxEventsByTopic: async () => [event],
        markOutboxEventProcessed,
        handlers: {
          'integration.xapi': vi.fn().mockRejectedValue(new Error('lrs unavailable')),
        },
      },
      { tenantId, limit: 10, now: processedAt },
    );

    expect(markOutboxEventProcessed).not.toHaveBeenCalled();
    expect(result).toEqual({ processed: 0, failed: 1, skipped: 0 });
  });

  it('skips notification delivery events because they have a dedicated dispatcher', async () => {
    const listPendingOutboxEventsByTopic = vi.fn();
    const handler = vi.fn();
    const markOutboxEventProcessed = vi.fn();

    const result = await dispatchOutboxEventBatch(
      {
        listPendingOutboxEventsByTopic,
        markOutboxEventProcessed,
        handlers: {
          'notification.delivery': handler,
        },
      },
      { tenantId, limit: 10, now: processedAt },
    );

    expect(listPendingOutboxEventsByTopic).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(markOutboxEventProcessed).not.toHaveBeenCalled();
    expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
  });

  it('does not scan unconfigured topics that could starve configured handlers', async () => {
    const event = createEvent();
    const listPendingOutboxEventsByTopic = vi.fn().mockResolvedValue([event]);
    const markOutboxEventProcessed = vi.fn();

    await dispatchOutboxEventBatch(
      {
        listPendingOutboxEventsByTopic,
        markOutboxEventProcessed,
        handlers: {
          'integration.xapi': vi.fn().mockResolvedValue(undefined),
        },
      },
      { tenantId, limit: 10, now: processedAt },
    );

    expect(listPendingOutboxEventsByTopic).toHaveBeenCalledTimes(1);
    expect(listPendingOutboxEventsByTopic).toHaveBeenCalledWith(tenantId, 'integration.xapi', 10);
  });

  it('skips events returned for the wrong topic without marking them processed', async () => {
    const event = createEvent({ topic: 'integration.export', eventType: 'export.completed' });
    const markOutboxEventProcessed = vi.fn();

    const result = await dispatchOutboxEventBatch(
      {
        listPendingOutboxEventsByTopic: async () => [event],
        markOutboxEventProcessed,
        handlers: {
          'integration.xapi': vi.fn(),
        },
      },
      { tenantId, limit: 10, now: processedAt },
    );

    expect(markOutboxEventProcessed).not.toHaveBeenCalled();
    expect(result).toEqual({ processed: 0, failed: 0, skipped: 1 });
  });

  it('produces learner notifications from visible grade lifecycle events', async () => {
    const event = createGradeLifecycleEvent();
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);
    const handler = createGradeLifecycleNotificationHandler({
      getSubmissionById: async () =>
        Submission.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE33',
          tenantId,
          assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
          studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
          groupId: null,
          sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE36',
          version: 1,
          status: 'submitted',
          contentSnapshot: [],
          submittedAt: now,
          createdAt: now,
          anonymousLabel: null,
        }),
      getAssignmentById: async () =>
        Assignment.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE34',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          moduleId: null,
          unitId: null,
          position: null,
          title: 'Essay 1',
          instructions: 'Write clearly.',
          status: 'published',
          dueAt: null,
          allowResubmission: false,
          activeRubricId: null,
          aiSettings: {
            precheckEnabled: false,
            feedbackDraftEnabled: false,
            scoreSuggestionEnabled: false,
          },
          latePenaltyPercentPerDay: null,
          lateMaxPenaltyPercent: null,
          extraCredit: false,
          anonymousGradingEnabled: false,
          groupSubmissionEnabled: false,
          groupSetId: null,
          gradingLocked: false,
          createdAt: now,
          updatedAt: now,
        }),
      listNotificationPreferencesForUser: async () => [],
      saveProducedNotification,
    });

    await handler(event);

    expect(saveProducedNotification).toHaveBeenCalledWith({
      notification: expect.objectContaining({
        tenantId,
        recipientId: '01J9QW7B6N5W2YH3D3A1V0KE35',
        category: 'grade_published',
        title: 'Grade published',
        body: 'A grade was published for Essay 1.',
        resourceType: 'submission',
        resourceId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      }),
      deliveryEvents: [],
    });
  });

  it('does not produce notifications for non-visible grade lifecycle statuses', async () => {
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);
    const handler = createGradeLifecycleNotificationHandler({
      getSubmissionById: vi.fn(),
      getAssignmentById: vi.fn(),
      listNotificationPreferencesForUser: async () => [],
      saveProducedNotification,
    });

    await handler(createGradeLifecycleEvent({ status: 'draft' }));

    expect(saveProducedNotification).not.toHaveBeenCalled();
  });

  it('produces learner notifications from feedback published events', async () => {
    const event = createFeedbackPublishedEvent();
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);
    const handler = createFeedbackPublishedNotificationHandler({
      getSubmissionById: async () =>
        Submission.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE33',
          tenantId,
          assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
          studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
          groupId: null,
          sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE36',
          version: 1,
          status: 'submitted',
          contentSnapshot: [],
          submittedAt: now,
          createdAt: now,
          anonymousLabel: null,
        }),
      getAssignmentById: async () =>
        Assignment.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE34',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          moduleId: null,
          unitId: null,
          position: null,
          title: 'Essay 1',
          instructions: 'Write clearly.',
          status: 'published',
          dueAt: null,
          allowResubmission: false,
          activeRubricId: null,
          aiSettings: {
            precheckEnabled: false,
            feedbackDraftEnabled: false,
            scoreSuggestionEnabled: false,
          },
          latePenaltyPercentPerDay: null,
          lateMaxPenaltyPercent: null,
          extraCredit: false,
          anonymousGradingEnabled: false,
          groupSubmissionEnabled: false,
          groupSetId: null,
          gradingLocked: false,
          createdAt: now,
          updatedAt: now,
        }),
      listNotificationPreferencesForUser: async () => [],
      saveProducedNotification,
    });

    await handler(event);

    expect(saveProducedNotification).toHaveBeenCalledWith({
      notification: expect.objectContaining({
        tenantId,
        recipientId: '01J9QW7B6N5W2YH3D3A1V0KE35',
        category: 'feedback_published',
        title: 'Feedback published',
        body: 'Feedback was published for Essay 1.',
        resourceType: 'published_feedback',
        resourceId: '01J9QW7B6N5W2YH3D3A1V0KE38',
      }),
      deliveryEvents: [],
    });
  });

  it('produces reviewer notifications from assigned human review events', async () => {
    const event = createHumanReviewAssignedEvent();
    const saveProducedNotification = vi.fn().mockImplementation(async (output) => output);
    const handler = createHumanReviewAssignedNotificationHandler({
      getSubmissionById: async () =>
        Submission.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE33',
          tenantId,
          assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE34',
          studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
          groupId: null,
          sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE36',
          version: 1,
          status: 'submitted',
          contentSnapshot: [],
          submittedAt: now,
          createdAt: now,
          anonymousLabel: null,
        }),
      getAssignmentById: async () =>
        Assignment.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE34',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          moduleId: null,
          unitId: null,
          position: null,
          title: 'Essay 1',
          instructions: 'Write clearly.',
          status: 'published',
          dueAt: null,
          allowResubmission: false,
          activeRubricId: null,
          aiSettings: {
            precheckEnabled: false,
            feedbackDraftEnabled: false,
            scoreSuggestionEnabled: false,
          },
          latePenaltyPercentPerDay: null,
          lateMaxPenaltyPercent: null,
          extraCredit: false,
          anonymousGradingEnabled: false,
          groupSubmissionEnabled: false,
          groupSetId: null,
          gradingLocked: false,
          createdAt: now,
          updatedAt: now,
        }),
      listNotificationPreferencesForUser: async () => [],
      saveProducedNotification,
    });

    await handler(event);

    expect(saveProducedNotification).toHaveBeenCalledWith({
      notification: expect.objectContaining({
        tenantId,
        recipientId: '01J9QW7B6N5W2YH3D3A1V0KE3A',
        category: 'review_requested',
        title: 'Review requested',
        body: 'Review requested for Essay 1.',
        resourceType: 'ai_feedback_draft',
        resourceId: '01J9QW7B6N5W2YH3D3A1V0KE39',
      }),
      deliveryEvents: [],
    });
  });

  it('produces learner notifications from published course announcements', async () => {
    const event = createAnnouncementPublishedEvent();
    const saveProducedNotifications = vi.fn().mockImplementation(async (output) => output);
    const handler = createAnnouncementPublishedNotificationHandler({
      listCourseMemberships: async () => [
        CourseMembership.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3D',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
          role: 'student',
          status: 'active',
          invitedAt: null,
          acceptedAt: now,
          droppedAt: null,
          withdrawnAt: null,
          createdAt: now,
          updatedAt: now,
        }),
        CourseMembership.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3F',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3G',
          role: 'student',
          status: 'active',
          invitedAt: null,
          acceptedAt: now,
          droppedAt: null,
          withdrawnAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      ],
      listNotificationPreferencesForUser: async () => [],
      saveProducedNotifications,
    });

    await handler(event);

    expect(saveProducedNotifications).toHaveBeenCalledTimes(1);
    expect(saveProducedNotifications).toHaveBeenCalledWith([
      {
        notification: expect.objectContaining({
          tenantId,
          recipientId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
          category: 'announcement_published',
          title: 'New course announcement',
          body: 'Essay workshop reminder was posted.',
          resourceType: 'course_announcement',
          resourceId: '01J9QW7B6N5W2YH3D3A1V0KE3B',
        }),
        deliveryEvents: [],
      },
      {
        notification: expect.objectContaining({
          tenantId,
          recipientId: '01J9QW7B6N5W2YH3D3A1V0KE3G',
          category: 'announcement_published',
          title: 'New course announcement',
          body: 'Essay workshop reminder was posted.',
          resourceType: 'course_announcement',
          resourceId: '01J9QW7B6N5W2YH3D3A1V0KE3B',
        }),
        deliveryEvents: [],
      },
    ]);
  });

  it('produces discussion reply notifications for topic subscribers except the author', async () => {
    const event = createDiscussionReplyCreatedEvent();
    const saveProducedNotifications = vi.fn().mockImplementation(async (output) => output);
    const handler = createDiscussionReplyNotificationHandler({
      getDiscussionTopicForCourse: async () =>
        DiscussionTopic.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3H',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          moduleId: null,
          unitId: null,
          title: 'Essay workshop',
          prompt: null,
          visibility: 'published',
          position: 0,
          createdAt: now,
          updatedAt: now,
        }),
      listCourseMemberships: async () => [
        CourseMembership.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3P',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
          role: 'student',
          status: 'active',
          invitedAt: null,
          acceptedAt: now,
          droppedAt: null,
          withdrawnAt: null,
          createdAt: now,
          updatedAt: now,
        }),
        CourseMembership.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3Q',
          tenantId,
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE37',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
          role: 'student',
          status: 'active',
          invitedAt: null,
          acceptedAt: now,
          droppedAt: null,
          withdrawnAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      ],
      listDiscussionTopicSubscriptions: async () => [
        DiscussionTopicSubscription.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3N',
          tenantId,
          topicId: '01J9QW7B6N5W2YH3D3A1V0KE3H',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
          createdAt: now,
        }),
        DiscussionTopicSubscription.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3M',
          tenantId,
          topicId: '01J9QW7B6N5W2YH3D3A1V0KE3H',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3C',
          createdAt: now,
        }),
        DiscussionTopicSubscription.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3R',
          tenantId,
          topicId: '01J9QW7B6N5W2YH3D3A1V0KE3H',
          userId: '01J9QW7B6N5W2YH3D3A1V0KE3S',
          createdAt: now,
        }),
      ],
      listNotificationPreferencesForUser: async () => [],
      saveProducedNotifications,
    });

    await handler(event);

    expect(saveProducedNotifications).toHaveBeenCalledTimes(1);
    expect(saveProducedNotifications).toHaveBeenCalledWith([
      {
        notification: expect.objectContaining({
          tenantId,
          recipientId: '01J9QW7B6N5W2YH3D3A1V0KE3E',
          category: 'discussion_reply',
          title: 'New discussion reply',
          body: 'A new reply was posted in Essay workshop.',
          resourceType: 'discussion_post',
          resourceId: '01J9QW7B6N5W2YH3D3A1V0KE3J',
        }),
        deliveryEvents: [],
      },
    ]);
  });

  it('forwards xAPI statement events to the configured endpoint', async () => {
    const event = createEvent();
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 202, statusText: 'Accepted' });
    const handler = createXapiForwardingHandler({
      endpointUrl: 'https://lrs.example.test/xapi/statements',
      authorizationHeader: 'Bearer xapi-token',
      fetch,
    });

    await handler(event);

    expect(fetch).toHaveBeenCalledWith(
      'https://lrs.example.test/xapi/statements',
      expect.objectContaining({
        method: 'POST',
        headers: {
          authorization: 'Bearer xapi-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(event.payload),
      }),
    );
  });

  it('fails xAPI forwarding when the remote endpoint rejects the statement', async () => {
    const event = createEvent();
    const handler = createXapiForwardingHandler({
      endpointUrl: 'https://lrs.example.test/xapi/statements',
      fetch: vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Unavailable' }),
    });

    await expect(handler(event)).rejects.toThrow(
      'xAPI forwarding endpoint responded with 503 Unavailable.',
    );
  });
});
