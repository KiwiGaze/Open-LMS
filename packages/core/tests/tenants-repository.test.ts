import { Tenant } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { updateTenantFileStorageQuotas } from '../src/tenants/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const now = new Date('2026-05-14T00:00:00.000Z');

const tenant = Tenant.parse({
  id: tenantId,
  slug: 'writing-school',
  displayName: 'Writing School',
  storageByteLimit: 1024,
  defaultUserStorageByteLimit: 256,
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: now,
});

const createUpdateDb = <T>(rows: T[], captured: { values: unknown }): Database =>
  ({
    update: () => ({
      set: (values: unknown) => {
        captured.values = values;
        return {
          where: () => ({
            returning: async () => rows,
          }),
        };
      },
    }),
  }) as unknown as Database;

describe('tenant repository', () => {
  it('updates file storage quota policy by tenant id', async () => {
    const captured = { values: null as unknown };

    await expect(
      updateTenantFileStorageQuotas(
        createUpdateDb([tenant], captured),
        {
          tenantId,
          storageByteLimit: 1024,
          defaultUserStorageByteLimit: 256,
        },
        now,
      ),
    ).resolves.toEqual(tenant);

    expect(captured.values).toEqual({
      storageByteLimit: 1024,
      defaultUserStorageByteLimit: 256,
      updatedAt: now,
    });
  });

  it('returns null when no tenant matches the update', async () => {
    const captured = { values: null as unknown };

    await expect(
      updateTenantFileStorageQuotas(
        createUpdateDb([], captured),
        {
          tenantId,
          storageByteLimit: null,
          defaultUserStorageByteLimit: null,
        },
        now,
      ),
    ).resolves.toBeNull();
  });
});
