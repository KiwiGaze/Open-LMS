import { describe, expect, it } from 'vitest';
import { ApiHttpError, asApiError, isForbidden, isUnauthorized } from './errors.ts';

describe('ApiHttpError', () => {
  it('extracts inner error envelope', () => {
    const err = new ApiHttpError(403, { error: { code: 'forbidden', message: 'nope' } });
    expect(err.status).toBe(403);
    expect(err.code).toBe('forbidden');
    expect(err.message).toBe('nope');
    expect(isForbidden(err)).toBe(true);
    expect(isUnauthorized(err)).toBe(false);
  });

  it('falls back to defaults when payload is missing the envelope', () => {
    const err = new ApiHttpError(500, null);
    expect(err.code).toBe('internal_error');
    expect(err.message).toMatch(/500/);
  });

  it('asApiError normalises Error instances', () => {
    expect(asApiError(new Error('boom'))).toEqual({
      code: 'internal_error',
      message: 'boom',
    });
  });

  it('asApiError prefers ApiHttpError code', () => {
    const err = new ApiHttpError(401, { error: { code: 'unauthorized', message: 'sign in' } });
    expect(asApiError(err)).toEqual({ code: 'unauthorized', message: 'sign in' });
    expect(isUnauthorized(err)).toBe(true);
  });
});
