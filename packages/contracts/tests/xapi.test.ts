import { describe, expect, it } from 'vitest';
import { XapiStatement, XapiStatementIngest } from '../src/index.ts';

const now = new Date('2026-05-14T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const xapiStatementId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const statementId = '550e8400-e29b-41d4-a716-446655440000';

describe('xAPI contracts', () => {
  it('models inbound xAPI statements for tenant-scoped storage', () => {
    const ingest = XapiStatementIngest.parse({
      id: statementId,
      actor: {
        objectType: 'Agent',
        account: {
          homePage: 'https://lms.example.edu',
          name: actorUserId,
        },
      },
      verb: {
        id: 'https://adlnet.gov/expapi/verbs/completed',
        display: { en: 'completed' },
      },
      object: {
        id: 'https://lms.example.edu/courses/course-1/scorm/package-1',
        objectType: 'Activity',
      },
      result: { completion: true, success: true },
      context: { platform: 'Open-LMS' },
      timestamp: '2026-05-14T00:00:00.000Z',
    });
    const stored = XapiStatement.parse({
      id: xapiStatementId,
      tenantId,
      statementId,
      receivedById: actorUserId,
      actor: ingest.actor,
      verb: ingest.verb,
      object: ingest.object,
      result: ingest.result,
      context: ingest.context,
      timestamp: now,
      storedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(stored.statementId).toBe(statementId);
    expect(stored.verb.id).toBe('https://adlnet.gov/expapi/verbs/completed');
  });
});
