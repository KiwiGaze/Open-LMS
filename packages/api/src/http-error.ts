export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal_error';

export type ApiErrorResponseBody = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

const errorStatusCodes: Record<ApiErrorCode, 400 | 401 | 403 | 404 | 409 | 429 | 500> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal_error: 500,
};

const malformedJsonMessage = 'Request body is not valid JSON. Check the JSON syntax and retry.';

const isMalformedJsonError = (error: unknown): boolean =>
  error instanceof SyntaxError && error.message.toLowerCase().includes('json');

const isHttpBadRequestError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'status' in error && error.status === 400;
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const statusCodeForError = (error: unknown): 400 | 401 | 403 | 404 | 409 | 429 | 500 => {
  if (error instanceof ApiError) {
    return errorStatusCodes[error.code];
  }

  if (isMalformedJsonError(error)) {
    return 400;
  }

  if (isHttpBadRequestError(error)) {
    return 400;
  }

  return 500;
};

export const errorResponseBody = (error: unknown): ApiErrorResponseBody => {
  if (error instanceof ApiError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  if (isMalformedJsonError(error)) {
    return {
      error: {
        code: 'bad_request',
        message: malformedJsonMessage,
      },
    };
  }

  if (isHttpBadRequestError(error)) {
    return {
      error: {
        code: 'bad_request',
        message: 'Request validation failed. Check the request path, query, and body.',
      },
    };
  }

  return {
    error: {
      code: 'internal_error',
      message: 'The request could not be completed. Retry the request or contact support.',
    },
  };
};
