import { z } from 'zod';
import { ConversationMessageId, ConversationThreadId, CourseId, TenantId, UserId } from './ids.ts';

export const ConversationThreadStatus = z.enum(['open', 'archived']);
export type ConversationThreadStatus = z.infer<typeof ConversationThreadStatus>;

export const ConversationThread = z.object({
  id: ConversationThreadId,
  tenantId: TenantId,
  courseId: CourseId.nullable(),
  subject: z.string().min(1).max(180),
  status: ConversationThreadStatus,
  participantIds: z.array(UserId).min(1),
  lastMessageAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ConversationThread = z.infer<typeof ConversationThread>;

export const ConversationMessage = z.object({
  id: ConversationMessageId,
  tenantId: TenantId,
  threadId: ConversationThreadId,
  senderId: UserId,
  body: z.string().min(1).max(10_000),
  sentAt: z.date(),
  createdAt: z.date(),
});
export type ConversationMessage = z.infer<typeof ConversationMessage>;
