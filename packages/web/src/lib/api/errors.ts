export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'internal_error';

export type ApiErrorShape = {
  code: ApiErrorCode | string;
  message: string;
};

export class ApiHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly payload: unknown;

  constructor(status: number, payload: ApiErrorShape | { error: ApiErrorShape } | unknown) {
    const inner =
      payload && typeof payload === 'object' && 'error' in (payload as Record<string, unknown>)
        ? ((payload as { error: ApiErrorShape }).error ?? null)
        : (payload as ApiErrorShape | null);

    const code = inner?.code ?? 'internal_error';
    const message = inner?.message ?? `Request failed (${status})`;
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export function asApiError(error: unknown): ApiErrorShape | null {
  if (error instanceof ApiHttpError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: 'internal_error', message: error.message };
  }
  return null;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiHttpError && error.status === 401;
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiHttpError && error.status === 403;
}
