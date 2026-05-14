import { Rubric } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { buildRubricVersionChangedEvent } from '../src/events/audit-outbox.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const rubric = Rubric.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE31',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  title: 'Evidence essay rubric',
  version: 3,
  sourceTemplateId: '01J9QW7B6N5W2YH3D3A1V0KE32',
  criteria: [
    {
      id: 'evidence',
      label: 'Evidence',
      description: 'Private rubric criterion text should stay out of events.',
      evidenceRequired: true,
      levels: [
        {
          id: 'strong',
          label: 'Strong',
          description: 'Uses evidence clearly.',
          points: 4,
        },
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
});

describe('rubric lifecycle events', () => {
  it('builds reference-only rubric version changed events', () => {
    const event = buildRubricVersionChangedEvent(rubric, now);

    expect(event.topic).toBe('rubric.lifecycle');
    expect(event.eventType).toBe('rubric.version_changed');
    expect(event.schemaVersion).toBe('1');
    expect(event.payload).toEqual({
      rubricId: rubric.id,
      version: 3,
      sourceTemplateId: rubric.sourceTemplateId,
      updatedAt: rubric.updatedAt.toISOString(),
    });
    expect(JSON.stringify(event.payload)).not.toContain('Private rubric criterion text');
  });
});
