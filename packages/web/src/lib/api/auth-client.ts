import { AUTH_BASE_URL } from './config.ts';
import { ApiHttpError } from './errors.ts';

/**
 * Minimal Better-Auth client. Better Auth provides its own client library, but
 * for the tiny set of endpoints we need (sign-in/email, sign-up/email,
 * sign-out, get-session), a hand-rolled fetch wrapper is simpler and keeps the
 * frontend bundle small.
 *
 * Endpoint reference: https://www.better-auth.com/docs/concepts/api
 */

export type SignInEmailInput = {
  email: string;
  password: string;
};

export type SignUpEmailInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
  expiresAt?: string | null;
  activeTenantId?: string | null;
};

/**
 * Raw shape returned by Better Auth. With the `bearer` plugin enabled the
 * sign-in response includes a `token`; the `get-session` response embeds
 * `session.token`. We normalise both to `AuthSession`.
 */
type BetterAuthShape = {
  user?: AuthUser;
  token?: string;
  session?: {
    id?: string;
    token?: string;
    expiresAt?: string | null;
    activeTenantId?: string | null;
  };
};

async function authFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<{ body: T; tokenHeader: string | null }> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('accept', 'application/json');
  let body: BodyInit | undefined = init?.body ?? undefined;
  if (init?.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    headers,
    body,
    credentials: 'include',
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!response.ok) {
    const payload =
      parsed && typeof parsed === 'object'
        ? {
            ...(parsed as Record<string, unknown>),
            code:
              typeof (parsed as { code?: unknown }).code === 'string'
                ? (parsed as { code: string }).code
                : `http_${response.status}`,
            message:
              typeof (parsed as { message?: unknown }).message === 'string'
                ? (parsed as { message: string }).message
                : response.statusText,
          }
        : parsed;
    throw new ApiHttpError(response.status, payload);
  }
  return {
    body: parsed as T,
    tokenHeader: response.headers.get('set-auth-token'),
  };
}

function normalise(shape: BetterAuthShape, tokenHeader: string | null): AuthSession | null {
  const token = tokenHeader ?? shape.token ?? shape.session?.token ?? null;
  if (!shape.user || !token) {
    return null;
  }
  return {
    user: shape.user,
    token,
    expiresAt: shape.session?.expiresAt ?? null,
    activeTenantId: shape.session?.activeTenantId ?? null,
  };
}

export async function signInEmail(input: SignInEmailInput): Promise<AuthSession> {
  const { body, tokenHeader } = await authFetch<BetterAuthShape>('/sign-in/email', {
    method: 'POST',
    json: input,
  });
  const session = normalise(body, tokenHeader);
  if (!session) {
    throw new ApiHttpError(500, {
      code: 'internal_error',
      message: 'Sign in succeeded but no session token was returned.',
    });
  }
  return session;
}

export async function signUpEmail(input: SignUpEmailInput): Promise<AuthSession> {
  const { body, tokenHeader } = await authFetch<BetterAuthShape>('/sign-up/email', {
    method: 'POST',
    json: input,
  });
  const session = normalise(body, tokenHeader);
  if (!session) {
    // Better Auth can succeed at sign-up while requiring email verification —
    // a session may not be issued. Surface that distinction.
    throw new ApiHttpError(202, {
      code: 'bad_request',
      message: 'Account created. Verify your email, then sign in.',
    });
  }
  return session;
}

export async function signOut(): Promise<void> {
  await authFetch<unknown>('/sign-out', { method: 'POST', json: {} });
}

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
};

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await authFetch<unknown>('/change-password', {
    method: 'POST',
    json: input,
  });
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const { body, tokenHeader } = await authFetch<BetterAuthShape>('/get-session', {
      method: 'GET',
    });
    return normalise(body, tokenHeader);
  } catch (error) {
    if (error instanceof ApiHttpError && (error.status === 401 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}
