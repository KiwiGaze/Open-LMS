import { Submission } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { buildSubmissionCreatedEvent } from '../src/events/audit-outbox.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const submission = Submission.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  studentId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE30',
  version: 2,
  status: 'submitted',
  contentSnapshot: [
    {
      blockId: 'intro',
      text: 'My private submission text should stay out of events.',
    },
  ],
  submittedAt: now,
  createdAt: now,
});

describe('submission lifecycle events', () => {
  it('builds reference-only submission created events', () => {
    const event = buildSubmissionCreatedEvent(submission, now);

    expect(event.topic).toBe('submission.lifecycle');
    expect(event.eventType).toBe('submission.created');
    expect(event.schemaVersion).toBe('1');
    expect(event.payload).toEqual({
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      sourceDraftId: submission.sourceDraftId,
      version: 2,
      status: 'submitted',
      submittedAt: submission.submittedAt.toISOString(),
    });
    expect(JSON.stringify(event.payload)).not.toContain('private submission text');
  });
});
