import { describe, expect, it } from 'vitest';
import { Tenant } from '../src/tenant.ts';

describe('tenant contract', () => {
  it('models tenant-level and default per-user file storage quotas', () => {
    const tenant = Tenant.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      slug: 'writing-school',
      displayName: 'Writing School',
      storageByteLimit: 1024 * 1024 * 1024,
      defaultUserStorageByteLimit: 1024 * 1024,
      createdAt: new Date('2026-05-14T00:00:00.000Z'),
      updatedAt: new Date('2026-05-14T00:00:00.000Z'),
    });

    expect(tenant.storageByteLimit).toBe(1073741824);
    expect(tenant.defaultUserStorageByteLimit).toBe(1048576);
  });

  it('defaults tenant file storage quotas to unlimited', () => {
    const tenant = Tenant.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      slug: 'writing-school',
      displayName: 'Writing School',
      createdAt: new Date('2026-05-14T00:00:00.000Z'),
      updatedAt: new Date('2026-05-14T00:00:00.000Z'),
    });

    expect(tenant.storageByteLimit).toBeNull();
    expect(tenant.defaultUserStorageByteLimit).toBeNull();
  });

  it('rejects quotas that cannot be represented safely in JavaScript', () => {
    expect(() =>
      Tenant.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        slug: 'writing-school',
        displayName: 'Writing School',
        storageByteLimit: Number.MAX_SAFE_INTEGER + 1,
        defaultUserStorageByteLimit: null,
        createdAt: new Date('2026-05-14T00:00:00.000Z'),
        updatedAt: new Date('2026-05-14T00:00:00.000Z'),
      }),
    ).toThrow();
  });
});
