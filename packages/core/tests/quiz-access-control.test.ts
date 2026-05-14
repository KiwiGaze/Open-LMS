import { describe, expect, it } from 'vitest';
import {
  hashQuizAccessPassword,
  isClientIpAllowedByRanges,
  normalizeQuizAllowedIpRanges,
  verifyQuizAccessPassword,
} from '../src/quizzes/access-control.ts';

describe('quiz access controls', () => {
  it('hashes quiz access passwords without preserving plaintext', () => {
    const hash = hashQuizAccessPassword('exam-room');

    expect(hash).not.toBe('exam-room');
    expect(hash).toMatch(/^scrypt:v1:/);
    expect(verifyQuizAccessPassword('exam-room', hash)).toBe(true);
    expect(verifyQuizAccessPassword('other-room', hash)).toBe(false);
  });

  it('matches exact IPv4 addresses and CIDR ranges', () => {
    expect(isClientIpAllowedByRanges('203.0.113.44', ['203.0.113.0/24'])).toBe(true);
    expect(isClientIpAllowedByRanges('198.51.100.10', ['198.51.100.10'])).toBe(true);
    expect(isClientIpAllowedByRanges('198.51.100.11', ['198.51.100.10'])).toBe(false);
    expect(isClientIpAllowedByRanges('203.0.114.44', ['203.0.113.0/24'])).toBe(false);
  });

  it('rejects malformed IP ranges at configuration time', () => {
    expect(() => normalizeQuizAllowedIpRanges(['203.0.113.0/24'])).not.toThrow();
    expect(() => normalizeQuizAllowedIpRanges(['203.0.113.0/33'])).toThrow(
      'Quiz allowed IP ranges must be IPv4 addresses or CIDR ranges.',
    );
    expect(() => normalizeQuizAllowedIpRanges(['not-an-ip'])).toThrow(
      'Quiz allowed IP ranges must be IPv4 addresses or CIDR ranges.',
    );
  });
});
