import { TenantFeatureFlag } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  deleteTenantFeatureFlag,
  listTenantFeatureFlags,
  upsertTenantFeatureFlag,
} from '../src/feature-flags/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const featureFlagId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const now = new Date('2026-05-14T00:00:00.000Z');

const flag = TenantFeatureFlag.parse({
  id: featureFlagId,
  tenantId,
  key: 'gradebook.final_grades',
  enabled: true,
  description: 'Enable final grade exports for pilot tenants.',
  createdAt: now,
  updatedAt: now,
});

const createListDb = (rows: TenantFeatureFlag[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createUpsertDb = (rows: TenantFeatureFlag[]): Database =>
  ({
    insert: () => ({
      values: (value: TenantFeatureFlag) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            rows.push(value);
            return [value];
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createDeleteDb = (deleted: { called: boolean }): Database =>
  ({
    delete: () => ({
      where: () => ({
        returning: async () => {
          deleted.called = true;
          return [{ id: featureFlagId }];
        },
      }),
    }),
  }) as unknown as Database;

describe('tenant feature flag repository', () => {
  it('lists tenant feature flags in key order', async () => {
    await expect(listTenantFeatureFlags(createListDb([flag]), tenantId)).resolves.toEqual([flag]);
  });

  it('upserts tenant feature flags by key', async () => {
    const rows: TenantFeatureFlag[] = [];

    const saved = await upsertTenantFeatureFlag(
      createUpsertDb(rows),
      {
        tenantId,
        key: 'gradebook.final_grades',
        enabled: true,
        description: 'Enable final grade exports for pilot tenants.',
      },
      now,
    );

    expect(saved).toMatchObject({
      tenantId,
      key: 'gradebook.final_grades',
      enabled: true,
    });
    expect(rows).toHaveLength(1);
  });

  it('deletes tenant feature flags by key', async () => {
    const deleted = { called: false };

    await expect(
      deleteTenantFeatureFlag(createDeleteDb(deleted), tenantId, 'gradebook.final_grades'),
    ).resolves.toBe(true);
    expect(deleted.called).toBe(true);
  });
});
