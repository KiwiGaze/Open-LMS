import type {
  Assignment,
  CourseMembership,
  DiscussionTopic,
  DiscussionTopicSubscription,
  OutboxEvent as OutboxEventContract,
  Submission,
} from '@openlms/contracts';
import { GradeStatus } from '@openlms/contracts';
import { z } from 'zod';
import {
  type NotificationBatchProducerPorts,
  type NotificationProducerPorts,
  produceNotification,
  produceNotifications,
} from '../notifications/delivery.ts';

type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'statusText'>>;

export type OutboxDispatchHandler = (event: OutboxEventContract) => Promise<void>;

export type OutboxDispatchHandlers = Record<string, OutboxDispatchHandler>;

export type OutboxDispatcherPorts = {
  listPendingOutboxEventsByTopic: (
    tenantId: string,
    topic: string,
    limit: number,
  ) => Promise<OutboxEventContract[]>;
  markOutboxEventProcessed: (
    tenantId: string,
    eventId: string,
    processedAt: Date,
  ) => Promise<OutboxEventContract>;
  handlers: OutboxDispatchHandlers;
};

export type OutboxDispatchBatchResult = {
  processed: number;
  failed: number;
  skipped: number;
};

export type XapiForwardingHandlerOptions = {
  endpointUrl: string;
  authorizationHeader?: string;
  fetch?: FetchLike;
};

type SubmissionAssignmentNotificationHandlerPorts = NotificationProducerPorts & {
  getSubmissionById: (tenantId: string, submissionId: string) => Promise<Submission | null>;
  getAssignmentById: (tenantId: string, assignmentId: string) => Promise<Assignment | null>;
};

export type GradeLifecycleNotificationHandlerPorts = SubmissionAssignmentNotificationHandlerPorts;

export type FeedbackPublishedNotificationHandlerPorts =
  SubmissionAssignmentNotificationHandlerPorts;

export type HumanReviewAssignedNotificationHandlerPorts =
  SubmissionAssignmentNotificationHandlerPorts;

export type AnnouncementPublishedNotificationHandlerPorts = NotificationBatchProducerPorts & {
  listCourseMemberships: (input: {
    tenantId: string;
    courseId: string;
    role: 'student';
    status: 'active';
  }) => Promise<CourseMembership[]>;
};

export type DiscussionReplyNotificationHandlerPorts = NotificationBatchProducerPorts & {
  getDiscussionTopicForCourse: (
    tenantId: string,
    courseId: string,
    topicId: string,
  ) => Promise<DiscussionTopic | null>;
  listCourseMemberships: (input: {
    tenantId: string;
    courseId: string;
    status: 'active';
  }) => Promise<CourseMembership[]>;
  listDiscussionTopicSubscriptions: (input: {
    tenantId: string;
    topicId: string;
  }) => Promise<DiscussionTopicSubscription[]>;
};

const visibleGradeStatuses = new Set(['published', 'locked', 'appealed', 'revised']);

const GradeLifecycleNotificationPayload = z
  .object({
    submissionId: z.string().min(1),
    status: GradeStatus,
  })
  .passthrough();

const FeedbackPublishedNotificationPayload = z
  .object({
    submissionId: z.string().min(1),
    publishedFeedbackId: z.string().min(1),
  })
  .passthrough();

const HumanReviewAssignedNotificationPayload = z
  .object({
    aiFeedbackDraftId: z.string().min(1),
    submissionId: z.string().min(1),
    reviewerId: z.string().min(1),
  })
  .passthrough();

const AnnouncementPublishedNotificationPayload = z
  .object({
    courseId: z.string().min(1),
    announcementId: z.string().min(1),
    authorId: z.string().min(1),
    title: z.string().min(1),
  })
  .passthrough();

const DiscussionReplyNotificationPayload = z
  .object({
    courseId: z.string().min(1),
    topicId: z.string().min(1),
    postId: z.string().min(1),
    parentPostId: z.string().min(1),
    authorId: z.string().min(1),
  })
  .passthrough();

export const dispatchOutboxEventBatch = async (
  ports: OutboxDispatcherPorts,
  input: { tenantId: string; limit: number; now?: Date },
): Promise<OutboxDispatchBatchResult> => {
  const now = input.now ?? new Date();
  const result: OutboxDispatchBatchResult = { processed: 0, failed: 0, skipped: 0 };
  let remaining = input.limit;

  for (const topic of Object.keys(ports.handlers)) {
    if (remaining <= 0) {
      break;
    }

    if (topic === 'notification.delivery') {
      continue;
    }

    const handler = ports.handlers[topic];
    if (!handler) {
      continue;
    }

    const events = await ports.listPendingOutboxEventsByTopic(input.tenantId, topic, remaining);

    for (const event of events) {
      remaining -= 1;

      if (event.topic !== topic) {
        result.skipped += 1;
        continue;
      }

      try {
        await handler(event);
        await ports.markOutboxEventProcessed(event.tenantId, event.id, now);
        result.processed += 1;
      } catch {
        result.failed += 1;
      }
    }
  }

  return result;
};

export const createXapiForwardingHandler = (
  options: XapiForwardingHandlerOptions,
): OutboxDispatchHandler => {
  const endpointUrl = new URL(options.endpointUrl).toString();
  const fetch = options.fetch ?? globalThis.fetch.bind(globalThis);

  return async (event) => {
    if (event.topic !== 'integration.xapi' || event.eventType !== 'xapi.statement_emitted') {
      throw new Error('Unsupported xAPI outbox event. Check the outbox topic and event type.');
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (options.authorizationHeader && options.authorizationHeader.trim() !== '') {
      headers.authorization = options.authorizationHeader;
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(event.payload),
    });

    if (!response.ok) {
      throw new Error(
        `xAPI forwarding endpoint responded with ${response.status} ${response.statusText}.`,
      );
    }
  };
};

export const createGradeLifecycleNotificationHandler = (
  ports: GradeLifecycleNotificationHandlerPorts,
): OutboxDispatchHandler => {
  return async (event) => {
    if (
      event.topic !== 'grade.lifecycle' ||
      (event.eventType !== 'grade.published' && event.eventType !== 'grade.changed')
    ) {
      throw new Error('Unsupported grade lifecycle event. Check the outbox topic and event type.');
    }

    const payload = GradeLifecycleNotificationPayload.parse(event.payload);
    if (!visibleGradeStatuses.has(payload.status)) {
      return;
    }

    const submission = await ports.getSubmissionById(event.tenantId, payload.submissionId);
    if (!submission) {
      return;
    }

    const assignment = await ports.getAssignmentById(event.tenantId, submission.assignmentId);
    if (!assignment) {
      return;
    }

    await produceNotification(
      ports,
      {
        tenantId: event.tenantId,
        recipientId: submission.studentId,
        category: 'grade_published',
        title: 'Grade published',
        body: `A grade was published for ${assignment.title}.`,
        resourceType: 'submission',
        resourceId: submission.id,
      },
      event.occurredAt,
    );
  };
};

export const createFeedbackPublishedNotificationHandler = (
  ports: FeedbackPublishedNotificationHandlerPorts,
): OutboxDispatchHandler => {
  return async (event) => {
    if (event.topic !== 'assignment.feedback' || event.eventType !== 'feedback.published') {
      throw new Error(
        'Unsupported feedback published event. Check the outbox topic and event type.',
      );
    }

    const payload = FeedbackPublishedNotificationPayload.parse(event.payload);
    const submission = await ports.getSubmissionById(event.tenantId, payload.submissionId);
    if (!submission) {
      return;
    }

    const assignment = await ports.getAssignmentById(event.tenantId, submission.assignmentId);
    if (!assignment) {
      return;
    }

    await produceNotification(
      ports,
      {
        tenantId: event.tenantId,
        recipientId: submission.studentId,
        category: 'feedback_published',
        title: 'Feedback published',
        body: `Feedback was published for ${assignment.title}.`,
        resourceType: 'published_feedback',
        resourceId: payload.publishedFeedbackId,
      },
      event.occurredAt,
    );
  };
};

export const createHumanReviewAssignedNotificationHandler = (
  ports: HumanReviewAssignedNotificationHandlerPorts,
): OutboxDispatchHandler => {
  return async (event) => {
    if (event.topic !== 'human_review.lifecycle' || event.eventType !== 'human_review.assigned') {
      throw new Error(
        'Unsupported human review assigned event. Check the outbox topic and event type.',
      );
    }

    const payload = HumanReviewAssignedNotificationPayload.parse(event.payload);
    const submission = await ports.getSubmissionById(event.tenantId, payload.submissionId);
    if (!submission) {
      return;
    }

    const assignment = await ports.getAssignmentById(event.tenantId, submission.assignmentId);
    if (!assignment) {
      return;
    }

    await produceNotification(
      ports,
      {
        tenantId: event.tenantId,
        recipientId: payload.reviewerId,
        category: 'review_requested',
        title: 'Review requested',
        body: `Review requested for ${assignment.title}.`,
        resourceType: 'ai_feedback_draft',
        resourceId: payload.aiFeedbackDraftId,
      },
      event.occurredAt,
    );
  };
};

export const createAnnouncementPublishedNotificationHandler = (
  ports: AnnouncementPublishedNotificationHandlerPorts,
): OutboxDispatchHandler => {
  return async (event) => {
    if (event.topic !== 'announcement.lifecycle' || event.eventType !== 'announcement.published') {
      throw new Error(
        'Unsupported announcement published event. Check the outbox topic and event type.',
      );
    }

    const payload = AnnouncementPublishedNotificationPayload.parse(event.payload);
    const memberships = await ports.listCourseMemberships({
      tenantId: event.tenantId,
      courseId: payload.courseId,
      role: 'student',
      status: 'active',
    });

    await produceNotifications(
      ports,
      memberships
        .filter((membership) => membership.userId !== payload.authorId)
        .map((membership) => ({
          tenantId: event.tenantId,
          recipientId: membership.userId,
          category: 'announcement_published',
          title: 'New course announcement',
          body: `${payload.title} was posted.`,
          resourceType: 'course_announcement',
          resourceId: payload.announcementId,
        })),
      event.occurredAt,
    );
  };
};

export const createDiscussionReplyNotificationHandler = (
  ports: DiscussionReplyNotificationHandlerPorts,
): OutboxDispatchHandler => {
  return async (event) => {
    if (event.topic !== 'discussion.lifecycle' || event.eventType !== 'discussion.reply_created') {
      throw new Error('Unsupported discussion reply event. Check the outbox topic and event type.');
    }

    const payload = DiscussionReplyNotificationPayload.parse(event.payload);
    const topic = await ports.getDiscussionTopicForCourse(
      event.tenantId,
      payload.courseId,
      payload.topicId,
    );
    if (!topic) {
      return;
    }

    const subscriptions = await ports.listDiscussionTopicSubscriptions({
      tenantId: event.tenantId,
      topicId: payload.topicId,
    });
    const memberships = await ports.listCourseMemberships({
      tenantId: event.tenantId,
      courseId: payload.courseId,
      status: 'active',
    });
    const activeMemberIds = new Set(memberships.map((membership) => membership.userId));

    await produceNotifications(
      ports,
      subscriptions
        .filter(
          (subscription) =>
            subscription.userId !== payload.authorId && activeMemberIds.has(subscription.userId),
        )
        .map((subscription) => ({
          tenantId: event.tenantId,
          recipientId: subscription.userId,
          category: 'discussion_reply',
          title: 'New discussion reply',
          body: `A new reply was posted in ${topic.title}.`,
          resourceType: 'discussion_post',
          resourceId: payload.postId,
        })),
      event.occurredAt,
    );
  };
};
