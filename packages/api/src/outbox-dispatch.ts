import {
  type OutboxDispatchBatchResult,
  type OutboxDispatchHandlers,
  createAnnouncementPublishedNotificationHandler,
  createDbHandle,
  createDiscussionReplyNotificationHandler,
  createFeedbackPublishedNotificationHandler,
  createGradeLifecycleNotificationHandler,
  createHumanReviewAssignedNotificationHandler,
  createXapiForwardingHandler,
  dispatchOutboxEventBatch,
  getAssignmentById,
  getDiscussionTopicForCourse,
  getSubmissionById,
  listCourseMemberships,
  listDiscussionTopicSubscriptions,
  listNotificationPreferencesForUser,
  listPendingOutboxEventsByTopic,
  markOutboxEventProcessed,
  saveProducedNotification,
  saveProducedNotifications,
} from '@openlms/core';
import type { Database } from '@openlms/core';

export type OutboxDispatchEnvironment = {
  DATABASE_CONNECTION_STRING?: string;
  OUTBOX_DISPATCH_LIMIT?: string;
  XAPI_FORWARD_ENDPOINT_URL?: string;
  XAPI_FORWARD_AUTHORIZATION?: string;
};

type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'statusText'>>;

export type OutboxDispatchOptions = {
  tenantId: string;
  limit?: number;
  now?: Date;
  fetch?: FetchLike;
};

export const readOutboxDispatchLimit = (
  environment: Pick<OutboxDispatchEnvironment, 'OUTBOX_DISPATCH_LIMIT'>,
): number => {
  const rawLimit = environment.OUTBOX_DISPATCH_LIMIT;
  if (rawLimit === undefined || rawLimit.trim() === '') {
    return 50;
  }

  if (!/^[1-9]\d*$/.test(rawLimit)) {
    throw new Error('OUTBOX_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  const limit = Number(rawLimit);
  if (limit > 500) {
    throw new Error('OUTBOX_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  return limit;
};

const readRequiredDatabaseUrl = (environment: OutboxDispatchEnvironment): string => {
  if (!environment.DATABASE_CONNECTION_STRING) {
    throw new Error('DATABASE_CONNECTION_STRING is required to dispatch outbox events.');
  }

  return environment.DATABASE_CONNECTION_STRING;
};

const readForwardingUrl = (value: string): string => {
  const url = new URL(value);
  const isLocalHttp =
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1');
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('XAPI_FORWARD_ENDPOINT_URL must be an https URL, except local http endpoints.');
  }

  return url.toString();
};

const buildHandlers = (
  environment: OutboxDispatchEnvironment,
  fetch: FetchLike,
  db: Database,
): OutboxDispatchHandlers => {
  const notificationPorts = {
    getSubmissionById: (tenantId: string, submissionId: string) =>
      getSubmissionById(db, tenantId, submissionId),
    getAssignmentById: (tenantId: string, assignmentId: string) =>
      getAssignmentById(db, tenantId, assignmentId),
    listNotificationPreferencesForUser: (input: {
      tenantId: string;
      userId: string;
    }) => listNotificationPreferencesForUser(db, input),
    saveProducedNotification: (input: Parameters<typeof saveProducedNotification>[1]) =>
      saveProducedNotification(db, input),
    saveProducedNotifications: (input: Parameters<typeof saveProducedNotifications>[1]) =>
      saveProducedNotifications(db, input),
  };
  const handlers: OutboxDispatchHandlers = {
    'assignment.feedback': createFeedbackPublishedNotificationHandler(notificationPorts),
    'grade.lifecycle': createGradeLifecycleNotificationHandler(notificationPorts),
    'human_review.lifecycle': createHumanReviewAssignedNotificationHandler(notificationPorts),
    'announcement.lifecycle': createAnnouncementPublishedNotificationHandler({
      ...notificationPorts,
      listCourseMemberships: (input) => listCourseMemberships(db, input),
    }),
    'discussion.lifecycle': createDiscussionReplyNotificationHandler({
      ...notificationPorts,
      getDiscussionTopicForCourse: (tenantId, courseId, topicId) =>
        getDiscussionTopicForCourse(db, tenantId, courseId, topicId),
      listCourseMemberships: (input) => listCourseMemberships(db, input),
      listDiscussionTopicSubscriptions: (input) => listDiscussionTopicSubscriptions(db, input),
    }),
  };
  const endpointUrl = environment.XAPI_FORWARD_ENDPOINT_URL;

  if (endpointUrl && endpointUrl.trim() !== '') {
    handlers['integration.xapi'] = createXapiForwardingHandler({
      endpointUrl: readForwardingUrl(endpointUrl),
      authorizationHeader: environment.XAPI_FORWARD_AUTHORIZATION,
      fetch,
    });
  }

  return handlers;
};

export const dispatchOutboxEvents = async (
  environment: OutboxDispatchEnvironment,
  options: OutboxDispatchOptions,
): Promise<OutboxDispatchBatchResult> => {
  const dbHandle = createDbHandle(readRequiredDatabaseUrl(environment));
  const fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const limit = options.limit ?? readOutboxDispatchLimit(environment);

  try {
    return await dispatchOutboxEventBatch(
      {
        listPendingOutboxEventsByTopic: (tenantId, topic, limit) =>
          listPendingOutboxEventsByTopic(dbHandle.db, tenantId, topic, limit),
        markOutboxEventProcessed: (tenantId, eventId, processedAt) =>
          markOutboxEventProcessed(dbHandle.db, tenantId, eventId, processedAt),
        handlers: buildHandlers(environment, fetch, dbHandle.db),
      },
      { tenantId: options.tenantId, limit, now: options.now },
    );
  } finally {
    await dbHandle.close();
  }
};
