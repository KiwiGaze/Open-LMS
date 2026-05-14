import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createConversationThread: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCourseMemberships: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createConversationThread: coreMocks.createConversationThread,
    createDbHandle: coreMocks.createDbHandle,
    listCourseMemberships: coreMocks.listCourseMemberships,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const recipientUserId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const outsiderUserId = '01J9QW7B6N5W2YH3D3A1V0KE89';
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
  id: '01J9QW7B6N5W2YH3D3A1V0KE87',
  tenantId,
  courseId,
  subject: 'Question about Module 3',
  status: 'open' as const,
  participantIds,
  lastMessageAt: now,
  createdAt: now,
  updatedAt: now,
});

const setCourseRoster = (userIds: string[]) => {
  coreMocks.listCourseMemberships.mockResolvedValue(
    userIds.map((userId) => ({
      id: `mem-${userId}`,
      tenantId,
      courseId,
      userId,
      role: 'student' as const,
      status: 'active' as const,
      enrolledAt: now,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    })),
  );
};

describe('conversation thread create API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createConversationThread.mockResolvedValue(
      sampleThread([actorUserId, recipientUserId]),
    );
    setCourseRoster([actorUserId, recipientUserId]);
    configureCourseAccess('student', 'student');
  });

  it('lets a student create a thread with another course member', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationThread(actorUserId, tenantId, courseId, {
        subject: 'Question about Module 3',
        participantIds: [recipientUserId],
        body: 'Hi, I had a question about the rubric.',
      }),
    ).resolves.toMatchObject({
      id: '01J9QW7B6N5W2YH3D3A1V0KE87',
      subject: 'Question about Module 3',
    });

    expect(coreMocks.createConversationThread).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        courseId,
        subject: 'Question about Module 3',
        participantIds: [actorUserId, recipientUserId],
        initialMessageSenderId: actorUserId,
        initialMessageBody: 'Hi, I had a question about the rubric.',
      }),
    );
  });

  it('lets staff start a thread with multiple students', async () => {
    configureCourseAccess('instructor', 'instructor');
    setCourseRoster([actorUserId, recipientUserId, outsiderUserId]);
    coreMocks.createConversationThread.mockResolvedValue(
      sampleThread([actorUserId, recipientUserId, outsiderUserId]),
    );

    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationThread(actorUserId, tenantId, courseId, {
        subject: 'Group reminder',
        participantIds: [recipientUserId, outsiderUserId],
        body: 'Quick reminder about office hours.',
      }),
    ).resolves.toMatchObject({ id: '01J9QW7B6N5W2YH3D3A1V0KE87' });

    expect(coreMocks.createConversationThread).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        participantIds: [actorUserId, recipientUserId, outsiderUserId],
      }),
    );
  });

  it('rejects participants who are not course members', async () => {
    setCourseRoster([actorUserId]);
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationThread(actorUserId, tenantId, courseId, {
        subject: 'Hello',
        participantIds: [recipientUserId],
        body: 'Hi.',
      }),
    ).rejects.toMatchObject({ code: 'bad_request' });

    expect(coreMocks.createConversationThread).not.toHaveBeenCalled();
  });

  it('rejects when the actor is not a member of the course', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createConversationThread(actorUserId, tenantId, courseId, {
        subject: 'Hello',
        participantIds: [recipientUserId],
        body: 'Hi.',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.createConversationThread).not.toHaveBeenCalled();
  });
});
