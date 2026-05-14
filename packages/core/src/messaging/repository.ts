import {
  ConversationMessage,
  type ConversationMessage as ConversationMessageContract,
  ConversationMessageId,
  ConversationThread,
  type ConversationThread as ConversationThreadContract,
  ConversationThreadId,
  type ConversationThreadStatus,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { conversationMessage, conversationThread } from '../db/schema/messaging.ts';

export type ListConversationThreadsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: ConversationThreadStatus[];
  participantId?: string;
};

export const listConversationThreadsForCourse = async (
  db: Database,
  input: ListConversationThreadsForCourseInput,
): Promise<ConversationThreadContract[]> => {
  const conditions = [
    eq(conversationThread.tenantId, input.tenantId),
    eq(conversationThread.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(conversationThread.status, input.statuses));
  }

  if (input.participantId) {
    conditions.push(sql`${conversationThread.participantIds} ? ${input.participantId}`);
  }

  const rows = await db
    .select()
    .from(conversationThread)
    .where(and(...conditions))
    .orderBy(desc(conversationThread.lastMessageAt));

  return rows.map((row) => ConversationThread.parse(row));
};

export const getConversationThreadForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  threadId: string,
): Promise<ConversationThreadContract | null> => {
  const [row] = await db
    .select()
    .from(conversationThread)
    .where(
      and(
        eq(conversationThread.tenantId, tenantId),
        eq(conversationThread.courseId, courseId),
        eq(conversationThread.id, threadId),
      ),
    )
    .limit(1);

  return row ? ConversationThread.parse(row) : null;
};

export type ListConversationMessagesForThreadInput = {
  tenantId: string;
  threadId: string;
};

export const listConversationMessagesForThread = async (
  db: Database,
  input: ListConversationMessagesForThreadInput,
): Promise<ConversationMessageContract[]> => {
  const rows = await db
    .select()
    .from(conversationMessage)
    .where(
      and(
        eq(conversationMessage.tenantId, input.tenantId),
        eq(conversationMessage.threadId, input.threadId),
      ),
    )
    .orderBy(asc(conversationMessage.sentAt));

  return rows.map((row) => ConversationMessage.parse(row));
};

export type CreateConversationThreadInput = {
  tenantId: string;
  courseId: string;
  subject: string;
  participantIds: string[];
  initialMessageSenderId: string;
  initialMessageBody: string;
};

// Creates a new thread along with its first message in a single transaction so
// the thread is never visible without at least one message.
export const createConversationThread = async (
  db: Database,
  input: CreateConversationThreadInput,
  now = new Date(),
): Promise<ConversationThreadContract> => {
  return db.transaction(async (tx) => {
    const threadId = ConversationThreadId.parse(ulid());
    const tenantId = TenantId.parse(input.tenantId);

    const [threadRow] = await tx
      .insert(conversationThread)
      .values({
        id: threadId,
        tenantId,
        courseId: CourseId.parse(input.courseId),
        subject: input.subject,
        status: 'open' satisfies ConversationThreadStatus,
        participantIds: input.participantIds.map((id) => UserId.parse(id)),
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!threadRow) {
      throw new Error(
        'Conversation thread could not be created because the database returned no row.',
      );
    }

    await tx.insert(conversationMessage).values({
      id: ConversationMessageId.parse(ulid()),
      tenantId,
      threadId,
      senderId: UserId.parse(input.initialMessageSenderId),
      body: input.initialMessageBody,
      sentAt: now,
      createdAt: now,
    });

    return ConversationThread.parse(threadRow);
  });
};

export type CreateConversationMessageInput = {
  tenantId: string;
  threadId: string;
  senderId: string;
  body: string;
  sentAt: Date;
};

// Inserts a new message and updates the thread's lastMessageAt in a single
// transaction so list ordering stays consistent.
export const createConversationMessage = async (
  db: Database,
  input: CreateConversationMessageInput,
  now = new Date(),
): Promise<ConversationMessageContract> => {
  return db.transaction(async (tx) => {
    const [messageRow] = await tx
      .insert(conversationMessage)
      .values({
        id: ConversationMessageId.parse(ulid()),
        tenantId: TenantId.parse(input.tenantId),
        threadId: ConversationThreadId.parse(input.threadId),
        senderId: UserId.parse(input.senderId),
        body: input.body,
        sentAt: input.sentAt,
        createdAt: now,
      })
      .returning();

    if (!messageRow) {
      throw new Error(
        'Conversation message could not be created because the database returned no row.',
      );
    }

    await tx
      .update(conversationThread)
      .set({ lastMessageAt: input.sentAt, updatedAt: now })
      .where(
        and(
          eq(conversationThread.tenantId, input.tenantId),
          eq(conversationThread.id, input.threadId),
        ),
      );

    return ConversationMessage.parse(messageRow);
  });
};

export type ListInboxThreadsForUserInput = {
  tenantId: string;
  userId: string;
  statuses?: ConversationThreadStatus[];
};

export const listInboxThreadsForUser = async (
  db: Database,
  input: ListInboxThreadsForUserInput,
): Promise<ConversationThreadContract[]> => {
  const conditions = [
    eq(conversationThread.tenantId, input.tenantId),
    sql`${conversationThread.participantIds} ? ${input.userId}`,
  ];
  if (input.statuses && input.statuses.length > 0) {
    conditions.push(inArray(conversationThread.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(conversationThread)
    .where(and(...conditions))
    .orderBy(desc(conversationThread.lastMessageAt));

  return rows.map((row) => ConversationThread.parse(row));
};
