import { Assignment } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { buildAssignmentLifecycleEvent } from '../src/events/audit-outbox.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const assignment = Assignment.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  title: 'Evidence essay',
  instructions: 'Write an essay that explains how evidence supports a claim.',
  status: 'published',
  dueAt: new Date('2026-05-11T00:00:00.000Z'),
  allowResubmission: true,
  activeRubricId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  aiSettings: {
    precheckEnabled: true,
    feedbackDraftEnabled: true,
    scoreSuggestionEnabled: false,
  },
  createdAt: now,
  updatedAt: now,
});

describe('assignment lifecycle events', () => {
  it('builds stable assignment lifecycle outbox events without copying instructions', () => {
    const event = buildAssignmentLifecycleEvent(
      {
        assignment,
        lifecycleEvent: 'published',
      },
      now,
    );

    expect(event.topic).toBe('assignment.lifecycle');
    expect(event.eventType).toBe('assignment.published');
    expect(event.schemaVersion).toBe('1');
    expect(event.payload).toEqual({
      assignmentId: assignment.id,
      courseId: assignment.courseId,
      status: 'published',
      activeRubricId: assignment.activeRubricId,
      updatedAt: assignment.updatedAt.toISOString(),
    });
    expect(JSON.stringify(event.payload)).not.toContain(assignment.instructions);
  });

  it('supports created, changed, and closed lifecycle event names', () => {
    expect(
      buildAssignmentLifecycleEvent({ assignment, lifecycleEvent: 'created' }, now).eventType,
    ).toBe('assignment.created');
    expect(
      buildAssignmentLifecycleEvent({ assignment, lifecycleEvent: 'changed' }, now).eventType,
    ).toBe('assignment.changed');
    expect(
      buildAssignmentLifecycleEvent({ assignment, lifecycleEvent: 'closed' }, now).eventType,
    ).toBe('assignment.closed');
  });
});
