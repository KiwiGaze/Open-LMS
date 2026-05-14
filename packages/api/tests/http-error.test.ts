import { describe, expect, it } from 'vitest';
import { ApiError, errorResponseBody, statusCodeForError } from '../src/http-error.ts';

describe('API error mapping', () => {
  it('maps known API errors to stable response bodies', () => {
    const error = new ApiError('not_found', 'Tenant was not found.');

    expect(statusCodeForError(error)).toBe(404);
    expect(errorResponseBody(error)).toEqual({
      error: {
        code: 'not_found',
        message: 'Tenant was not found.',
      },
    });
  });

  it('maps unknown errors to internal server error without leaking details', () => {
    const error = new Error('database password appeared in a stack trace');

    expect(statusCodeForError(error)).toBe(500);
    expect(errorResponseBody(error)).toEqual({
      error: {
        code: 'internal_error',
        message: 'The request could not be completed. Retry the request or contact support.',
      },
    });
  });

  it('maps malformed JSON parser errors to bad requests without leaking parser details', () => {
    const error = new SyntaxError('Unexpected end of JSON input');

    expect(statusCodeForError(error)).toBe(400);
    expect(errorResponseBody(error)).toEqual({
      error: {
        code: 'bad_request',
        message: 'Request body is not valid JSON. Check the JSON syntax and retry.',
      },
    });
  });

  it('maps framework bad request errors to generic validation failures', () => {
    const error = Object.assign(new Error('Bad Request'), { status: 400 });

    expect(statusCodeForError(error)).toBe(400);
    expect(errorResponseBody(error)).toEqual({
      error: {
        code: 'bad_request',
        message: 'Request validation failed. Check the request path, query, and body.',
      },
    });
  });
});
