import { describe, expect, it } from 'vitest';
import { TenantFeatureFlag } from '../src/index.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const featureFlagId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const now = new Date('2026-05-14T00:00:00.000Z');

describe('tenant feature flag contracts', () => {
  it('models tenant-scoped rollout flags', () => {
    const flag = TenantFeatureFlag.parse({
      id: featureFlagId,
      tenantId,
      key: 'gradebook.final_grades',
      enabled: true,
      description: 'Enable final grade exports for pilot tenants.',
      createdAt: now,
      updatedAt: now,
    });

    expect(flag.key).toBe('gradebook.final_grades');
  });

  it('rejects blank and whitespace feature keys', () => {
    expect(() =>
      TenantFeatureFlag.parse({
        id: featureFlagId,
        tenantId,
        key: 'bad key',
        enabled: true,
        description: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });
});
