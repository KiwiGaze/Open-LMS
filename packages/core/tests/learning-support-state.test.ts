import type { CourseId, LearningObjectiveId, TenantId, UserId } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildLearningSupportConversation,
  buildLearningSupportTutorSession,
} from '../src/support/learning-support.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as UserId;
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as LearningObjectiveId;
const threadId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const now = new Date('2026-05-13T00:00:00.000Z');

describe('buildLearningSupportConversation', () => {
  it('falls back to the existing inbox thread when no learning state is available', () => {
    const conversation = buildLearningSupportConversation({
      tenantId,
      courseId,
      studentId,
      objectiveIds: [],
      evidenceIds: [],
      unresolvedMisconceptionIds: [],
      citedSources: [],
      fallbackThreadId: threadId,
      resolvedOutcome: null,
      updatedAt: now,
    });

    expect(conversation.mode).toBe('traditional_thread_fallback');
    expect(conversation.fallbackThreadId).toBe(threadId);
    expect(conversation.escalationState).toBe('none');
  });

  it('escalates learning support when misconceptions persist with evidence', () => {
    const conversation = buildLearningSupportConversation({
      tenantId,
      courseId,
      studentId,
      objectiveIds: [objectiveId],
      evidenceIds: ['evidence-1', 'evidence-2'],
      unresolvedMisconceptionIds: ['ratio-as-subtraction'],
      citedSources: [
        {
          resourceType: 'course_page',
          resourceId: 'page-1',
          title: 'Ratio notes',
        },
      ],
      fallbackThreadId: threadId,
      resolvedOutcome: null,
      updatedAt: now,
    });

    expect(conversation).toMatchObject({
      mode: 'learning_support',
      status: 'open',
      escalationState: 'needs_instructor',
      objectiveIds: [objectiveId],
      evidenceIds: ['evidence-1', 'evidence-2'],
      unresolvedMisconceptionIds: ['ratio-as-subtraction'],
      fallbackThreadId: threadId,
    });
  });

  it('marks a tutor session as escalated once a fallback thread is created', () => {
    const session = buildLearningSupportTutorSession({
      sessionId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      tenantId,
      courseId,
      studentId,
      objectiveIds: [objectiveId],
      evidenceIds: ['evidence-1'],
      unresolvedMisconceptionIds: ['ratio-as-subtraction'],
      citedSources: [
        {
          resourceType: 'course_page',
          resourceId: 'page-1',
          title: 'Ratio notes',
        },
      ],
      fallbackThreadId: threadId,
      resolvedOutcome: null,
      updatedAt: now,
    });

    expect(session).toMatchObject({
      tutorState: 'escalated',
      fallbackThreadId: threadId,
      evidenceIds: ['evidence-1'],
    });
  });
});
