/**
 * Base URL for the LMS API. Falls back to the same origin (which is rewritten
 * to the backend by `next.config.mjs` in dev) when no explicit env is set.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';

/**
 * Better Auth is mounted at /api/auth/* on the API server. The same Next.js
 * rewrite that proxies /api/v1/* also proxies /api/auth/*.
 */
export const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? '/api/auth';
