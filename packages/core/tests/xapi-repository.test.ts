import { XapiStatement } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { saveXapiStatement } from '../src/xapi/repository.ts';

const now = new Date('2026-05-14T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const receivedById = '01J9QW7B6N5W2YH3D3A1V0KE71';
const statementId = '550e8400-e29b-41d4-a716-446655440000';

const storedStatement = XapiStatement.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE72',
  tenantId,
  statementId,
  receivedById,
  actor: { objectType: 'Agent', account: { homePage: 'https://lms.example.edu', name: 'user-1' } },
  verb: { id: 'https://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
  object: { id: 'https://lms.example.edu/activity/1', objectType: 'Activity' },
  result: { completion: true },
  context: { platform: 'Open-LMS' },
  timestamp: now,
  storedAt: now,
  createdAt: now,
  updatedAt: now,
});

const createInsertDb = (rows: XapiStatement[]): Database =>
  ({
    insert: () => ({
      values: (value: XapiStatement) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            rows.push(value);
            return [value];
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createConflictDb = (rows: XapiStatement[]): Database =>
  ({
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: async () => [],
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

describe('xAPI statement repository', () => {
  it('stores inbound xAPI statements', async () => {
    const rows: XapiStatement[] = [];

    const saved = await saveXapiStatement(
      createInsertDb(rows),
      {
        tenantId,
        statementId,
        receivedById,
        actor: storedStatement.actor,
        verb: storedStatement.verb,
        object: storedStatement.object,
        result: storedStatement.result,
        context: storedStatement.context,
        timestamp: now,
      },
      now,
    );

    expect(saved.statementId).toBe(statementId);
    expect(rows).toHaveLength(1);
  });

  it('returns the existing statement when the xAPI statement id was already stored', async () => {
    const saved = await saveXapiStatement(
      createConflictDb([storedStatement]),
      {
        tenantId,
        statementId,
        receivedById,
        actor: storedStatement.actor,
        verb: storedStatement.verb,
        object: storedStatement.object,
        result: null,
        context: null,
        timestamp: null,
      },
      now,
    );

    expect(saved).toEqual(storedStatement);
  });
});
