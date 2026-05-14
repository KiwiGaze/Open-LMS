import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { account, session, user, verification } from '../db/schema/auth.ts';

type AuthEmailAndPasswordOptions = NonNullable<BetterAuthOptions['emailAndPassword']>;
type AuthEmailVerificationOptions = NonNullable<BetterAuthOptions['emailVerification']>;

export type AuthPasswordResetEmailInput = Parameters<
  NonNullable<AuthEmailAndPasswordOptions['sendResetPassword']>
>[0];

export type AuthVerificationEmailInput = Parameters<
  NonNullable<AuthEmailVerificationOptions['sendVerificationEmail']>
>[0];

export type AuthConfig = {
  db: Database;
  secret: string;
  baseUrl: string;
  trustedOrigins?: string[];
  sendPasswordResetEmail: (input: AuthPasswordResetEmailInput, request?: Request) => Promise<void>;
  sendVerificationEmail: (input: AuthVerificationEmailInput, request?: Request) => Promise<void>;
};

export const buildAuthOptions = (config: AuthConfig): BetterAuthOptions => ({
  database: drizzleAdapter(config.db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  secret: config.secret,
  baseURL: config.baseUrl,
  trustedOrigins: config.trustedOrigins,
  advanced: {
    database: {
      generateId: () => ulid(),
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: config.sendPasswordResetEmail,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: config.sendVerificationEmail,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
    additionalFields: {
      activeTenantId: {
        type: 'string',
        required: false,
        defaultValue: null,
        fieldName: 'active_tenant_id',
      },
    },
  },
});

export const createAuth = (config: AuthConfig) => betterAuth(buildAuthOptions(config));

export type Auth = ReturnType<typeof createAuth>;
