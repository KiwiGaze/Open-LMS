// Pure token-bucket rate limiter for AI invocations. Callers persist the
// bucket state (e.g. per tenant + action + user) between invocations and pass
// it in along with the current time and the cost of the request. The function
// computes the refill since lastRefillAt, decides whether the request is
// allowed, and returns the updated state to be persisted.

export type TokenBucketState = {
  capacity: number;
  refillTokensPerSecond: number;
  tokensRemaining: number;
  lastRefillAt: Date;
};

export type ConsumeFromBucketInput = {
  state: TokenBucketState;
  requestedTokens: number;
  now: Date;
};

export type ConsumeFromBucketResult = {
  allowed: boolean;
  state: TokenBucketState;
  retryAfterSeconds: number | null;
};

export const consumeFromBucket = (input: ConsumeFromBucketInput): ConsumeFromBucketResult => {
  if (input.requestedTokens <= 0) {
    return { allowed: true, state: input.state, retryAfterSeconds: null };
  }

  const elapsedSeconds = Math.max(
    (input.now.getTime() - input.state.lastRefillAt.getTime()) / 1000,
    0,
  );
  const refilled = Math.min(
    input.state.capacity,
    input.state.tokensRemaining + elapsedSeconds * input.state.refillTokensPerSecond,
  );

  if (input.requestedTokens > input.state.capacity) {
    return {
      allowed: false,
      state: { ...input.state, tokensRemaining: refilled, lastRefillAt: input.now },
      retryAfterSeconds: null,
    };
  }

  if (refilled >= input.requestedTokens) {
    return {
      allowed: true,
      state: {
        ...input.state,
        tokensRemaining: refilled - input.requestedTokens,
        lastRefillAt: input.now,
      },
      retryAfterSeconds: null,
    };
  }

  const tokensShort = input.requestedTokens - refilled;
  const retryAfterSeconds =
    input.state.refillTokensPerSecond > 0
      ? Math.ceil(tokensShort / input.state.refillTokensPerSecond)
      : null;

  return {
    allowed: false,
    state: { ...input.state, tokensRemaining: refilled, lastRefillAt: input.now },
    retryAfterSeconds,
  };
};

// Convenience constructor that initializes a fresh, full bucket.
export const initialTokenBucketState = (
  capacity: number,
  refillTokensPerSecond: number,
  now = new Date(),
): TokenBucketState => ({
  capacity,
  refillTokensPerSecond,
  tokensRemaining: capacity,
  lastRefillAt: now,
});
