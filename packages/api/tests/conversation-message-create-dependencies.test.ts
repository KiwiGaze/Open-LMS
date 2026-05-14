import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createConversationMessage: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getConversationThreadForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createConversationMessage: coreMocks.createConversationMessage,
    createDbHandle: coreMocks.createDbHandle,
    getConversationThreadForCourse: coreMocks.getConversationThreadForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const threadId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const otherUserId = '01J9QW7B6N5W2YH3D3A1V0KE88';
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

const sampleThread = (participantIds: string[]) => ({
  id: threadId,
  tenantId,
  courseId,
  subject: 'Sample thread',
  status: 'open' as const,
  participantIds,
  lastMessageAt: now,
  createdAt: now,
  updatedAt: now,
});

const sampleMessage = () => ({
  id: '01J9QW7B6N5W2YH3D3A1V0KE4Z',
  tenantId,
  threadId,
  senderId: actorUserId,
  body: 'Hello',
  sentAt: now,
  createdAt: now,
});

describe('conversation message create API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getConversationThreadForCourse.mockResolvedValue(sampleThread([actorUserId]));
    coreMocks.createConversationMessage.mockResolvedValue(sampleMessage());
    configureCourseAccess('student', 'student');
  });

  it('lets a participant send a message', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationMessage(actorUserId, tenantId, courseId, threadId, {
        body: 'Hello',
      }),
    ).resolves.toMatchObject({ id: '01J9QW7B6N5W2YH3D3A1V0KE4Z', body: 'Hello' });

    expect(coreMocks.createConversationMessage).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        threadId,
        senderId: actorUserId,
        body: 'Hello',
      }),
    );
  });

  it('lets staff send messages on any thread', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getConversationThreadForCourse.mockResolvedValue(sampleThread([otherUserId]));
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationMessage(actorUserId, tenantId, courseId, threadId, {
        body: 'Heads-up',
      }),
    ).resolves.toMatchObject({ id: '01J9QW7B6N5W2YH3D3A1V0KE4Z' });
  });

  it('returns not_found when actor is not a participant and not staff', async () => {
    coreMocks.getConversationThreadForCourse.mockResolvedValue(sampleThread([otherUserId]));
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationMessage(actorUserId, tenantId, courseId, threadId, {
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.createConversationMessage).not.toHaveBeenCalled();
  });

  it('returns not_found when thread is missing', async () => {
    coreMocks.getConversationThreadForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationMessage(actorUserId, tenantId, courseId, threadId, {
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
