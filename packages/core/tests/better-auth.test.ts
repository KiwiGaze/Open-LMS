import { describe, expect, it } from 'vitest';
import { buildAuthOptions } from '../src/auth/better-auth.ts';
import type { Database } from '../src/db/client.ts';

const db = {} as Database;

describe('Better Auth configuration', () => {
  it('builds Better Auth options for the Core auth schema and session tenant field', async () => {
    const sentVerificationEmails: unknown[] = [];
    const sentPasswordResetEmails: unknown[] = [];
    const options = buildAuthOptions({
      db,
      secret: 'test-secret-with-at-least-32-characters',
      baseUrl: 'http://localhost:3000',
      trustedOrigins: ['http://localhost:3000'],
      sendVerificationEmail: async (input) => {
        sentVerificationEmails.push(input);
      },
      sendPasswordResetEmail: async (input) => {
        sentPasswordResetEmails.push(input);
      },
    });

    expect(options.baseURL).toBe('http://localhost:3000');
    expect(options.trustedOrigins).toEqual(['http://localhost:3000']);
    expect(options.emailAndPassword?.enabled).toBe(true);
    expect(options.emailAndPassword?.requireEmailVerification).toBe(true);
    expect(options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(true);
    expect(options.emailVerification?.sendOnSignUp).toBe(true);
    expect(options.emailVerification?.sendOnSignIn).toBe(true);
    expect(options.session?.cookieCache?.enabled).toBe(false);
    expect(options.session?.additionalFields?.activeTenantId).toEqual(
      expect.objectContaining({
        type: 'string',
        required: false,
        defaultValue: null,
        fieldName: 'active_tenant_id',
      }),
    );
    const generateId = options.advanced?.database?.generateId;
    expect(typeof generateId).toBe('function');
    if (typeof generateId !== 'function') {
      throw new Error('Better Auth generateId should be configured as a function.');
    }
    expect(generateId({ model: 'user' })).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

    const emailInput = {
      user: {
        id: 'user_1',
        email: 'learner@example.edu',
        emailVerified: false,
        name: 'Learner Example',
        createdAt: new Date('2026-05-14T00:00:00.000Z'),
        updatedAt: new Date('2026-05-14T00:00:00.000Z'),
        image: null,
      },
      url: 'http://localhost:3000/api/auth/verify-email?token=verification-token',
      token: 'verification-token',
    };

    await options.emailVerification?.sendVerificationEmail?.(emailInput);
    await options.emailAndPassword?.sendResetPassword?.({
      ...emailInput,
      token: 'reset-token',
      url: 'http://localhost:3000/api/auth/reset-password/reset-token',
    });

    expect(sentVerificationEmails).toEqual([emailInput]);
    expect(sentPasswordResetEmails).toEqual([
      {
        ...emailInput,
        token: 'reset-token',
        url: 'http://localhost:3000/api/auth/reset-password/reset-token',
      },
    ]);
  });
});
