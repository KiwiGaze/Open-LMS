import { API_BASE_URL } from './config.ts';
import { ApiHttpError } from './errors.ts';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  /** Override the bearer token. If absent, read from session store. */
  token?: string | null;
  /** Expected response form. Defaults to 'json'. */
  responseType?: 'json' | 'text' | 'blob' | 'void';
  /** Extra headers (e.g. CSV import upload type). */
  headers?: Record<string, string>;
  /** Pass through to fetch's `keepalive` flag (lets a request survive page unload). */
  keepalive?: boolean;
};

let currentToken: string | null = null;
let tokenChangeListener: ((token: string | null) => void) | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
  tokenChangeListener?.(token);
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function onAuthTokenChange(fn: (token: string | null) => void): void {
  tokenChangeListener = fn;
}

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const base = path.startsWith('http') ? '' : API_BASE_URL.replace(/\/$/, '');
  const trimmed = path.startsWith('http') ? path : `/${path.replace(/^\/+/, '')}`;
  const url = base + trimmed;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('accept', 'application/json');

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData || options.body instanceof Blob) {
      body = options.body;
    } else {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(options.body);
    }
  }

  const token = options.token === undefined ? currentToken : options.token;
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
    credentials: 'include',
    ...(options.keepalive ? { keepalive: true } : {}),
  });

  if (response.status === 204 || options.responseType === 'void') {
    if (!response.ok) {
      await throwFromResponse(response);
    }
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = isJson ? await response.json() : await response.text();
    } catch {
      payload = null;
    }
    throw new ApiHttpError(response.status, payload);
  }

  switch (options.responseType ?? 'json') {
    case 'text':
      return (await response.text()) as T;
    case 'blob':
      return (await response.blob()) as T;
    default:
      return (await response.json()) as T;
  }
}

async function throwFromResponse(response: Response): Promise<never> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  throw new ApiHttpError(response.status, payload);
}
