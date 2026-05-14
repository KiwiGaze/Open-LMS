import { createHash } from 'node:crypto';
import { type TokenBucketState, consumeFromBucket, initialTokenBucketState } from '@openlms/ai';
import type { MiddlewareHandler } from 'hono';
import { ApiError, errorResponseBody } from './http-error.ts';

export type HttpRateLimitOptions = {
  capacity: number;
  refillTokensPerSecond: number;
  maxBuckets?: number;
  now?: () => Date;
  exemptPaths?: readonly string[];
};

export type HttpRateLimitDecision = {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds: number | null;
};

const defaultExemptPaths = ['/health', '/api/v1/openapi.json'] as const;

export const defaultHttpRateLimitOptions: HttpRateLimitOptions = {
  capacity: 600,
  refillTokensPerSecond: 10,
  maxBuckets: 10_000,
  exemptPaths: defaultExemptPaths,
};

const hashRateLimitKey = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const extractHttpRateLimitKey = (request: Request): string => {
  const authorization = request.headers.get('authorization');

  if (authorization) {
    return `auth:${hashRateLimitKey(authorization)}`;
  }

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const clientAddress = forwardedFor || realIp || 'unknown';

  return `ip:${clientAddress}`;
};

export class InMemoryHttpRateLimiter {
  private readonly capacity: number;
  private readonly refillTokensPerSecond: number;
  private readonly maxBuckets: number;
  private readonly now: () => Date;
  private readonly buckets = new Map<string, TokenBucketState>();

  constructor(options: HttpRateLimitOptions) {
    if (!Number.isFinite(options.capacity) || options.capacity <= 0) {
      throw new Error('HTTP rate-limit capacity must be greater than zero.');
    }
    if (!Number.isFinite(options.refillTokensPerSecond) || options.refillTokensPerSecond < 0) {
      throw new Error('HTTP rate-limit refill rate must be zero or greater.');
    }
    const maxBuckets = options.maxBuckets ?? defaultHttpRateLimitOptions.maxBuckets;
    if (!maxBuckets || !Number.isInteger(maxBuckets) || maxBuckets <= 0) {
      throw new Error('HTTP rate-limit maxBuckets must be a positive integer.');
    }

    this.capacity = options.capacity;
    this.refillTokensPerSecond = options.refillTokensPerSecond;
    this.maxBuckets = maxBuckets;
    this.now = options.now ?? (() => new Date());
  }

  consume(key: string): HttpRateLimitDecision {
    const now = this.now();
    const currentState =
      this.buckets.get(key) ??
      initialTokenBucketState(this.capacity, this.refillTokensPerSecond, now);
    const result = consumeFromBucket({
      state: currentState,
      requestedTokens: 1,
      now,
    });

    if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value;

      if (oldestKey) {
        this.buckets.delete(oldestKey);
      }
    } else if (this.buckets.has(key)) {
      this.buckets.delete(key);
    }

    this.buckets.set(key, result.state);

    return {
      allowed: result.allowed,
      remainingTokens: Math.floor(result.state.tokensRemaining),
      retryAfterSeconds: result.retryAfterSeconds,
    };
  }
}

const mergeRateLimitOptions = (
  options: Partial<HttpRateLimitOptions> | undefined,
): HttpRateLimitOptions => ({
  ...defaultHttpRateLimitOptions,
  ...options,
  exemptPaths: options?.exemptPaths ?? defaultHttpRateLimitOptions.exemptPaths,
});

export const createHttpRateLimitMiddleware = (
  options: Partial<HttpRateLimitOptions> | false | undefined,
): MiddlewareHandler => {
  if (options === false) {
    return async (_context, next) => {
      await next();
    };
  }

  const mergedOptions = mergeRateLimitOptions(options);
  const exemptPaths = new Set(mergedOptions.exemptPaths);
  const limiter = new InMemoryHttpRateLimiter(mergedOptions);

  return async (context, next) => {
    const path = new URL(context.req.url).pathname;

    if (exemptPaths.has(path)) {
      await next();
      return;
    }

    const decision = limiter.consume(extractHttpRateLimitKey(context.req.raw));
    context.header('X-RateLimit-Limit', String(mergedOptions.capacity));
    context.header('X-RateLimit-Remaining', String(decision.remainingTokens));

    if (!decision.allowed) {
      if (decision.retryAfterSeconds !== null) {
        context.header('Retry-After', String(decision.retryAfterSeconds));
      }

      return context.json(
        errorResponseBody(
          new ApiError(
            'rate_limited',
            'Too many requests. Retry after the rate-limit window resets.',
          ),
        ),
        429,
      );
    }

    await next();
  };
};
