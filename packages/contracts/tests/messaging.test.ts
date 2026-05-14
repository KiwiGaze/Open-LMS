import { describe, expect, it } from 'vitest';
import { ConversationMessage, ConversationThread } from '../src/messaging.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const threadId = '01J9QW7B6N5W2YH3D3A1V0KE4Y';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const instructorId = '01J9QW7B6N5W2YH3D3A1V0KE4Z';

describe('messaging contracts', () => {
  it('accepts course conversation threads with participants', () => {
    expect(
      ConversationThread.parse({
        id: threadId,
        tenantId,
        courseId,
        subject: 'Essay feedback question',
        status: 'open',
        participantIds: [actorId, instructorId],
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      id: threadId,
      courseId,
      status: 'open',
      participantIds: [actorId, instructorId],
    });
  });

  it('accepts course conversation messages', () => {
    expect(
      ConversationMessage.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE50',
        tenantId,
        threadId,
        senderId: actorId,
        body: 'Can you clarify the evidence note?',
        sentAt: now,
        createdAt: now,
      }),
    ).toMatchObject({
      threadId,
      senderId: actorId,
      body: 'Can you clarify the evidence note?',
    });
  });
});
