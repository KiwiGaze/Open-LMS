import { describe, expect, it } from 'vitest';
import {
  LearningSupportConversation,
  LearningSupportTutorSession,
} from '../src/learning-support.ts';

const now = new Date('2026-05-13T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const threadId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('learning support contracts', () => {
  it('anchors support conversations to learning state', () => {
    expect(
      LearningSupportConversation.parse({
        tenantId,
        courseId,
        studentId,
        mode: 'learning_support',
        status: 'open',
        escalationState: 'needs_instructor',
        objectiveIds: [objectiveId],
        evidenceIds: ['evidence-1'],
        unresolvedMisconceptionIds: ['ratio-as-subtraction'],
        citedSources: [
          {
            resourceType: 'course_page',
            resourceId: 'page-1',
            title: 'Ratio comparison notes',
          },
        ],
        reusableOutcome: null,
        fallbackThreadId: null,
        updatedAt: now,
      }),
    ).toMatchObject({
      mode: 'learning_support',
      escalationState: 'needs_instructor',
      unresolvedMisconceptionIds: ['ratio-as-subtraction'],
    });
  });

  it('represents inbox threads as an explicit fallback', () => {
    expect(
      LearningSupportConversation.parse({
        tenantId,
        courseId,
        studentId,
        mode: 'traditional_thread_fallback',
        status: 'open',
        escalationState: 'none',
        objectiveIds: [],
        evidenceIds: [],
        unresolvedMisconceptionIds: [],
        citedSources: [],
        reusableOutcome: null,
        fallbackThreadId: threadId,
        updatedAt: now,
      }),
    ).toMatchObject({
      mode: 'traditional_thread_fallback',
      fallbackThreadId: threadId,
    });
  });

  it('models a tutor session around learning evidence and handoff state', () => {
    expect(
      LearningSupportTutorSession.parse({
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
            title: 'Ratio comparison notes',
          },
        ],
        tutorState: 'handoff_recommended',
        fallbackThreadId: threadId,
        reusableOutcome: null,
        updatedAt: now,
      }),
    ).toMatchObject({
      tutorState: 'handoff_recommended',
      fallbackThreadId: threadId,
      evidenceIds: ['evidence-1'],
    });
  });
});
