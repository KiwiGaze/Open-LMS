import { RetentionPolicy } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  calculateUserRetainUntil,
  getRetentionPolicy,
  listRetentionPolicies,
  upsertRetentionPolicy,
} from '../src/retention/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const policyId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const now = new Date('2026-05-14T00:00:00.000Z');

const policy = RetentionPolicy.parse({
  id: policyId,
  tenantId,
  targetType: 'deleted_user',
  retainDays: 365,
  createdAt: now,
  updatedAt: now,
});

const createListDb = (rows: RetentionPolicy[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createGetDb = (rows: RetentionPolicy[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createUpsertDb = (rows: RetentionPolicy[]): Database =>
  ({
    insert: () => ({
      values: (value: RetentionPolicy) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            rows.push(value);
            return [value];
          },
        }),
      }),
    }),
  }) as unknown as Database;

describe('retention policy repository', () => {
  it('lists tenant retention policies in target order', async () => {
    await expect(listRetentionPolicies(createListDb([policy]), tenantId)).resolves.toEqual([
      policy,
    ]);
  });

  it('gets a retention policy by tenant and target type', async () => {
    await expect(
      getRetentionPolicy(createGetDb([policy]), tenantId, 'deleted_user'),
    ).resolves.toEqual(policy);
  });

  it('upserts a tenant retention policy by target type', async () => {
    const rows: RetentionPolicy[] = [];

    const saved = await upsertRetentionPolicy(
      createUpsertDb(rows),
      {
        tenantId,
        targetType: 'deleted_user',
        retainDays: 365,
      },
      now,
    );

    expect(saved).toMatchObject({
      tenantId,
      targetType: 'deleted_user',
      retainDays: 365,
      createdAt: now,
      updatedAt: now,
    });
    expect(rows).toHaveLength(1);
  });

  it('calculates deleted-user retention deadlines from whole-day policies', () => {
    const deletedAt = new Date('2026-05-14T10:15:00.000Z');

    expect(calculateUserRetainUntil(deletedAt, policy)).toEqual(
      new Date('2027-05-14T10:15:00.000Z'),
    );
    expect(calculateUserRetainUntil(deletedAt, null)).toBeNull();
  });
});
