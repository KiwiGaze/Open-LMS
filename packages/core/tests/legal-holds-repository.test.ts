import { UserLegalHold } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  createUserLegalHold,
  listUserLegalHolds,
  releaseUserLegalHold,
} from '../src/legal-holds/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const userId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEF2';
const legalHoldId = '01J9QW7B6N5W2YH3D3A1V0KEF3';
const now = new Date('2026-05-14T00:00:00.000Z');

const legalHold = UserLegalHold.parse({
  id: legalHoldId,
  tenantId,
  userId,
  createdById: actorUserId,
  reason: 'Grade appeal retention',
  releasedAt: null,
  createdAt: now,
  updatedAt: now,
});

const createListDb = (rows: UserLegalHold[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createInsertDb = (rows: UserLegalHold[]): Database =>
  ({
    insert: () => ({
      values: (value: UserLegalHold) => ({
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createReleaseDb = (rows: UserLegalHold[]): Database =>
  ({
    update: () => ({
      set: (value: { releasedAt: Date; updatedAt: Date }) => ({
        where: () => ({
          returning: async () => {
            const row = rows.find((item) => item.id === legalHoldId && item.releasedAt === null);

            if (!row) {
              return [];
            }

            const released = UserLegalHold.parse({ ...row, ...value });
            rows[rows.indexOf(row)] = released;
            return [released];
          },
        }),
      }),
    }),
  }) as unknown as Database;

describe('user legal hold repository', () => {
  it('lists active legal holds for a tenant user', async () => {
    await expect(
      listUserLegalHolds(createListDb([legalHold]), {
        tenantId,
        userId,
        status: 'active',
      }),
    ).resolves.toEqual([legalHold]);
  });

  it('creates an active legal hold with generated identity', async () => {
    const rows: UserLegalHold[] = [];

    const saved = await createUserLegalHold(
      createInsertDb(rows),
      {
        tenantId,
        userId,
        createdById: actorUserId,
        reason: 'Grade appeal retention',
      },
      now,
    );

    expect(saved).toMatchObject({
      tenantId,
      userId,
      createdById: actorUserId,
      reason: 'Grade appeal retention',
      releasedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(rows).toHaveLength(1);
  });

  it('releases an active legal hold', async () => {
    const rows = [legalHold];
    const releasedAt = new Date('2026-05-15T00:00:00.000Z');

    await expect(
      releaseUserLegalHold(createReleaseDb(rows), {
        tenantId,
        legalHoldId,
        releasedAt,
      }),
    ).resolves.toMatchObject({
      id: legalHoldId,
      releasedAt,
      updatedAt: releasedAt,
    });
  });
});
