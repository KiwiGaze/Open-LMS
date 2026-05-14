import { describe, expect, it } from 'vitest';
import { formatNumber, formatPercent, initialsOf } from './format.ts';

describe('format', () => {
  it('formatNumber handles null and undefined', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber(0)).toBe('0');
  });

  it('formatNumber respects fractionDigits', () => {
    expect(formatNumber(1.456, 2)).toBe('1.46');
  });

  it('formatPercent handles edge values', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(0.5)).toBe('50%');
  });

  it('initialsOf collapses to up to two initials', () => {
    expect(initialsOf('Jordan Lee')).toBe('JL');
    expect(initialsOf('  Jordan  Lee  Park ')).toBe('JL');
    expect(initialsOf('Madonna')).toBe('M');
    expect(initialsOf('')).toBe('·');
    expect(initialsOf(null)).toBe('·');
  });
});
