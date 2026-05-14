import { describe, expect, it } from 'vitest';
import { TenantId, UserId, isTenantId, isUserId } from '../src/ids.ts';

describe('IDs', () => {
  it('parses a valid tenant id', () => {
    const raw = '01J9QW7B6N5W2YH3D3A1V0KE2T';

    expect(TenantId.parse(raw)).toBe(raw);
  });

  it('rejects non-ULID strings as tenant id', () => {
    expect(() => TenantId.parse('not-a-ulid')).toThrow();
  });

  it('narrows tenant ids', () => {
    expect(isTenantId('01J9QW7B6N5W2YH3D3A1V0KE2T')).toBe(true);
    expect(isTenantId('plain-string')).toBe(false);
  });

  it('supports distinct branded user ids with the same underlying shape', () => {
    const raw = '01J9QW7B6N5W2YH3D3A1V0KE2T';

    expect(UserId.parse(raw)).toBe(raw);
    expect(isUserId(raw)).toBe(true);
  });
});
