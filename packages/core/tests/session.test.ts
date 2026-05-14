import { describe, expect, it } from 'vitest';
import {
  CoreSession,
  assertActiveTenantSession,
  getActiveTenantForSession,
  getCoreSessionByToken,
  setActiveTenant,
} from '../src/auth/session.ts';
import type { Database } from '../src/db/client.ts';
import { session as sessionTable } from '../src/db/schema/auth.ts';
import { tenantMembership as membershipTable } from '../src/db/schema/membership.ts';

type SessionLookupRow = {
  userId: string;
  activeTenantId: string | null;
  expiresAt: Date;
  userStatus: string;
  userDeletedAt: Date | null;
};

const createSessionDb = (options: { membershipExists: boolean; updateSucceeds?: boolean }) => {
  const sessionRow = {
    id: 'session-1',
    userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
    token: 'session-token',
    activeTenantId: null as string | null,
  };

  const db = {
    select: (projection?: unknown) => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table === membershipTable) {
              return options.membershipExists ? [{ id: 'membership-1' }] : [];
            }

            if (table === sessionTable && projection) {
              return [{ activeTenantId: sessionRow.activeTenantId }];
            }

            return [];
          },
        }),
      }),
    }),
    update: () => ({
      set: (value: { activeTenantId?: string | null }) => ({
        where: () => ({
          returning: async () => {
            if (options.updateSucceeds === false) {
              return [];
            }

            sessionRow.activeTenantId = value.activeTenantId ?? null;
            return [{ id: sessionRow.id }];
          },
        }),
      }),
    }),
  } as unknown as Database;

  return {
    db,
    sessionRow,
  };
};

const createSessionLookupDb = (row: SessionLookupRow | null) =>
  ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: async () => (row ? [row] : []),
          }),
        }),
        where: () => ({
          limit: async () => (row ? [row] : []),
        }),
      }),
    }),
  }) as unknown as Database;

describe('session tenant guard', () => {
  it('returns the active tenant for a valid session', () => {
    const tenantId = assertActiveTenantSession(
      CoreSession.parse({
        userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        activeTenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );

    expect(tenantId).toBe('01J9QW7B6N5W2YH3D3A1V0KE2V');
  });

  it('rejects sessions without an active tenant', () => {
    expect(() =>
      assertActiveTenantSession(
        CoreSession.parse({
          userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
          activeTenantId: null,
          expiresAt: new Date(Date.now() + 60_000),
        }),
      ),
    ).toThrow(/active tenant/);
  });

  it('rejects expired sessions', () => {
    expect(() =>
      assertActiveTenantSession(
        CoreSession.parse({
          userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
          activeTenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
          expiresAt: new Date(Date.now() - 60_000),
        }),
      ),
    ).toThrow(/expired/);
  });

  it('sets active tenant only when the user has a tenant membership', async () => {
    const store = createSessionDb({ membershipExists: true });

    await setActiveTenant(store.db, {
      sessionToken: 'session-token',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
    });

    expect(await getActiveTenantForSession(store.db, 'session-token')).toBe(
      '01J9QW7B6N5W2YH3D3A1V0KE2V',
    );
  });

  it('rejects active tenant changes when membership is absent', async () => {
    const store = createSessionDb({ membershipExists: false });

    await expect(
      setActiveTenant(store.db, {
        sessionToken: 'session-token',
        userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      }),
    ).rejects.toThrow(/active member/);

    expect(store.sessionRow.activeTenantId).toBeNull();
  });

  it('clears active tenant without a membership lookup', async () => {
    const store = createSessionDb({ membershipExists: false });
    store.sessionRow.activeTenantId = '01J9QW7B6N5W2YH3D3A1V0KE2V';

    await setActiveTenant(store.db, {
      sessionToken: 'session-token',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: null,
    });

    expect(await getActiveTenantForSession(store.db, 'session-token')).toBeNull();
  });

  it('returns a core session when the owning user is active', async () => {
    const session = await getCoreSessionByToken(
      createSessionLookupDb({
        userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        activeTenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        expiresAt: new Date(Date.now() + 60_000),
        userStatus: 'active',
        userDeletedAt: null,
      }),
      'session-token',
    );

    expect(session).toEqual({
      userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      activeTenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      expiresAt: expect.any(Date),
    });
  });

  it('rejects sessions whose owning user is deleted', async () => {
    const session = await getCoreSessionByToken(
      createSessionLookupDb({
        userId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        activeTenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        expiresAt: new Date(Date.now() + 60_000),
        userStatus: 'deleted',
        userDeletedAt: new Date('2026-05-14T00:00:00.000Z'),
      }),
      'session-token',
    );

    expect(session).toBeNull();
  });
});
