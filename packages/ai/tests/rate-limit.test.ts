import { describe, expect, it } from 'vitest';
import {
  type TokenBucketState,
  consumeFromBucket,
  initialTokenBucketState,
} from '../src/rate-limit.ts';

const t0 = new Date('2026-05-10T00:00:00.000Z');
const elapsed = (seconds: number): Date => new Date(t0.getTime() + seconds * 1000);

describe('consumeFromBucket', () => {
  it('allows a request that fits in a full bucket', () => {
    const state = initialTokenBucketState(10, 1, t0);
    const result = consumeFromBucket({ state, requestedTokens: 3, now: t0 });

    expect(result.allowed).toBe(true);
    expect(result.state.tokensRemaining).toBe(7);
    expect(result.retryAfterSeconds).toBeNull();
  });

  it('rejects a request that exceeds the available tokens with no time elapsed', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 1,
      tokensRemaining: 2,
      lastRefillAt: t0,
    };

    const result = consumeFromBucket({ state, requestedTokens: 5, now: t0 });

    expect(result.allowed).toBe(false);
    expect(result.state.tokensRemaining).toBe(2);
    expect(result.retryAfterSeconds).toBe(3);
  });

  it('refills based on elapsed time before evaluating availability', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 1,
      tokensRemaining: 1,
      lastRefillAt: t0,
    };

    const result = consumeFromBucket({ state, requestedTokens: 5, now: elapsed(5) });

    expect(result.allowed).toBe(true);
    expect(result.state.tokensRemaining).toBe(1);
    expect(result.state.lastRefillAt).toEqual(elapsed(5));
  });

  it('caps the refilled tokens at the bucket capacity', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 5,
      tokensRemaining: 1,
      lastRefillAt: t0,
    };

    const result = consumeFromBucket({ state, requestedTokens: 0, now: elapsed(100) });

    expect(result.allowed).toBe(true);
    expect(result.state.tokensRemaining).toBe(1);
  });

  it('rejects requests larger than the bucket capacity outright', () => {
    const state = initialTokenBucketState(5, 1, t0);
    const result = consumeFromBucket({ state, requestedTokens: 100, now: t0 });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeNull();
    expect(result.state.tokensRemaining).toBe(5);
  });

  it('treats zero-cost requests as always allowed without mutating state', () => {
    const state = initialTokenBucketState(10, 1, t0);
    const result = consumeFromBucket({ state, requestedTokens: 0, now: elapsed(5) });

    expect(result.allowed).toBe(true);
    expect(result.state).toBe(state);
  });

  it('returns null retryAfter when refill rate is zero and request exceeds bucket', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 0,
      tokensRemaining: 1,
      lastRefillAt: t0,
    };

    const result = consumeFromBucket({ state, requestedTokens: 5, now: elapsed(60) });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeNull();
  });

  it('rejects clock-skew negative elapsed time without granting refill', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 1,
      tokensRemaining: 1,
      lastRefillAt: elapsed(10),
    };

    const result = consumeFromBucket({ state, requestedTokens: 5, now: t0 });

    expect(result.allowed).toBe(false);
    expect(result.state.tokensRemaining).toBe(1);
  });

  it('refills fractional tokens precisely', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 0.5,
      tokensRemaining: 0,
      lastRefillAt: t0,
    };

    const result = consumeFromBucket({ state, requestedTokens: 1, now: elapsed(3) });

    expect(result.allowed).toBe(true);
    expect(result.state.tokensRemaining).toBeCloseTo(0.5, 10);
  });

  it('reports retryAfter rounded up so callers wait long enough', () => {
    const state: TokenBucketState = {
      capacity: 10,
      refillTokensPerSecond: 1,
      tokensRemaining: 0.5,
      lastRefillAt: t0,
    };

    const result = consumeFromBucket({ state, requestedTokens: 2, now: t0 });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(2);
  });
});

describe('initialTokenBucketState', () => {
  it('creates a bucket with full capacity', () => {
    const state = initialTokenBucketState(20, 2, t0);
    expect(state).toEqual({
      capacity: 20,
      refillTokensPerSecond: 2,
      tokensRemaining: 20,
      lastRefillAt: t0,
    });
  });
});
