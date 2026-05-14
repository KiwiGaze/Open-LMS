import { describe, expect, it } from 'vitest';
import { cn } from './cn.ts';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', false, 'c')).toBe('a b c');
  });

  it('dedupes conflicting tailwind utilities, last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });

  it('respects conditional objects', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });
});
