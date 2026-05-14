import { describe, expect, it } from 'vitest';
import { InMemoryHttpRateLimiter, extractHttpRateLimitKey } from '../src/rate-limit.ts';

describe('HTTP rate limiting', () => {
  it('uses a token bucket per request key', () => {
    let now = new Date('2026-05-14T00:00:00.000Z');
    const limiter = new InMemoryHttpRateLimiter({
      capacity: 2,
      refillTokensPerSecond: 1,
      now: () => now,
    });

    expect(limiter.consume('auth:one')).toMatchObject({
      allowed: true,
      remainingTokens: 1,
      retryAfterSeconds: null,
    });
    expect(limiter.consume('auth:one')).toMatchObject({
      allowed: true,
      remainingTokens: 0,
      retryAfterSeconds: null,
    });
    expect(limiter.consume('auth:one')).toMatchObject({
      allowed: false,
      remainingTokens: 0,
      retryAfterSeconds: 1,
    });
    expect(limiter.consume('auth:two')).toMatchObject({ allowed: true, remainingTokens: 1 });

    now = new Date('2026-05-14T00:00:01.000Z');

    expect(limiter.consume('auth:one')).toMatchObject({
      allowed: true,
      remainingTokens: 0,
      retryAfterSeconds: null,
    });
  });

  it('keys authenticated requests without storing raw bearer tokens', () => {
    const request = new Request('https://api.example.test/api/v1/tenants', {
      headers: { authorization: 'Bearer secret-token' },
    });

    const key = extractHttpRateLimitKey(request);

    expect(key).toMatch(/^auth:[a-f0-9]{64}$/);
    expect(key).not.toContain('secret-token');
  });

  it('falls back to forwarded client address for anonymous requests', () => {
    const request = new Request('https://api.example.test/api/v1/lti-1p3/authorize', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.4' },
    });

    expect(extractHttpRateLimitKey(request)).toBe('ip:203.0.113.10');
  });

  it('bounds stored buckets by evicting the oldest key', () => {
    const limiter = new InMemoryHttpRateLimiter({
      capacity: 1,
      refillTokensPerSecond: 0,
      maxBuckets: 2,
      now: () => new Date('2026-05-14T00:00:00.000Z'),
    });

    expect(limiter.consume('ip:first')).toMatchObject({ allowed: true, remainingTokens: 0 });
    expect(limiter.consume('ip:second')).toMatchObject({ allowed: true, remainingTokens: 0 });
    expect(limiter.consume('ip:third')).toMatchObject({ allowed: true, remainingTokens: 0 });

    expect(limiter.consume('ip:first')).toMatchObject({ allowed: true, remainingTokens: 0 });
    expect(limiter.consume('ip:second')).toMatchObject({ allowed: true, remainingTokens: 0 });
    expect(limiter.consume('ip:third')).toMatchObject({ allowed: true, remainingTokens: 0 });
  });
});
