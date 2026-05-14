import { describe, expect, it } from 'vitest';
import {
  UserDeletionBlockedByLegalHoldError,
  anonymizeAuthUserForDeletion,
  deleteAuthUserById,
} from '../src/auth/admin.ts';
import type { Database } from '../src/db/client.ts';
import { auditLog } from '../src/db/schema/audit.ts';
import { account, session, user } from '../src/db/schema/auth.ts';
import { userLegalHold } from '../src/db/schema/legal-hold.ts';

const createAuthAdminDb = (options?: { activeLegalHold?: boolean }) => {
  const deletedUserIds: string[] = [];
  const deletedCredentialUserIds: string[] = [];
  const deletedSessionUserIds: string[] = [];
  const anonymizedUsers: Array<Record<string, unknown>> = [];
  const redactedAuditLogs: Array<Record<string, unknown>> = [];
  const userId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
  const db = {
    delete: (table: unknown) => ({
      where: async () => {
        if (table === user) {
          deletedUserIds.push(userId);
        }
        if (table === account) {
          deletedCredentialUserIds.push(userId);
        }
        if (table === session) {
          deletedSessionUserIds.push(userId);
        }
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        if (table === auditLog) {
          return {
            where: async () => {
              redactedAuditLogs.push(values);
            },
          };
        }

        expect(table).toBe(user);

        return {
          where: () => ({
            returning: async () => {
              anonymizedUsers.push(values);
              return [
                {
                  id: userId,
                  email: values.email,
                  emailVerified: values.emailVerified,
                  name: values.name,
                  image: values.image,
                  locale: values.locale,
                  timezone: values.timezone,
                  status: values.status,
                  deletedAt: values.deletedAt,
                  retainUntil: values.retainUntil,
                  createdAt: new Date('2026-05-01T00:00:00.000Z'),
                  updatedAt: values.updatedAt,
                },
              ];
            },
          }),
        };
      },
    }),
    transaction: async <T>(callback: (transactionDb: Database) => Promise<T>) => {
      return callback(db as unknown as Database);
    },
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () =>
            table === userLegalHold && options?.activeLegalHold === true
              ? [
                  {
                    id: '01J9QW7B6N5W2YH3D3A1V0KE90',
                    tenantId: '01J9QW7B6N5W2YH3D3A1V0KE91',
                    userId,
                    createdById: '01J9QW7B6N5W2YH3D3A1V0KE93',
                    reason: 'Active grade appeal retention hold',
                    releasedAt: null,
                    createdAt: new Date('2026-05-11T00:00:00.000Z'),
                    updatedAt: new Date('2026-05-11T00:00:00.000Z'),
                  },
                ]
              : table === user
                ? [
                    {
                      id: userId,
                      email: 'user@example.com',
                      emailVerified: true,
                      name: 'Jordan Lee',
                      image: 'https://example.com/avatar.png',
                      locale: 'en-US',
                      timezone: 'America/New_York',
                      status: 'active',
                      deletedAt: null,
                      createdAt: new Date('2026-05-01T00:00:00.000Z'),
                      updatedAt: new Date('2026-05-01T00:00:00.000Z'),
                    },
                  ]
                : [],
        }),
      }),
    }),
  } as unknown as Database;

  return {
    db,
    deletedUserIds,
    deletedCredentialUserIds,
    deletedSessionUserIds,
    anonymizedUsers,
    redactedAuditLogs,
  };
};

describe('auth admin compensation', () => {
  it('deletes a Better Auth user by id for failed tenant bootstrap compensation', async () => {
    const store = createAuthAdminDb();

    await deleteAuthUserById(store.db, '01J9QW7B6N5W2YH3D3A1V0KE2T');

    expect(store.deletedUserIds).toEqual(['01J9QW7B6N5W2YH3D3A1V0KE2T']);
  });

  it('anonymizes a user while preserving the user row and deleting auth credentials and sessions', async () => {
    const store = createAuthAdminDb();
    const now = new Date('2026-05-12T00:00:00.000Z');

    const user = await anonymizeAuthUserForDeletion(store.db, '01J9QW7B6N5W2YH3D3A1V0KE2T', now);

    expect(user).toMatchObject({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      email: 'deleted+01j9qw7b6n5w2yh3d3a1v0ke2t@deleted.openlms.local',
      displayName: 'Deleted user',
      emailVerified: false,
      status: 'deleted',
      deletedAt: now,
      retainUntil: null,
      updatedAt: now,
    });
    expect(store.anonymizedUsers).toEqual([
      {
        email: 'deleted+01j9qw7b6n5w2yh3d3a1v0ke2t@deleted.openlms.local',
        emailVerified: false,
        image: null,
        locale: null,
        name: 'Deleted user',
        status: 'deleted',
        timezone: null,
        deletedAt: now,
        retainUntil: null,
        updatedAt: now,
      },
    ]);
    expect(store.deletedCredentialUserIds).toEqual(['01J9QW7B6N5W2YH3D3A1V0KE2T']);
    expect(store.deletedSessionUserIds).toEqual(['01J9QW7B6N5W2YH3D3A1V0KE2T']);
    expect(store.redactedAuditLogs).toEqual([
      {
        actorId: null,
        metadata: {
          redacted: true,
          redactedAt: now.toISOString(),
          redactedReason: 'user_deleted',
        },
      },
    ]);
    expect(store.deletedUserIds).toEqual([]);
  });

  it('blocks preserved user deletion while an active legal hold exists', async () => {
    const store = createAuthAdminDb({ activeLegalHold: true });

    await expect(
      anonymizeAuthUserForDeletion(
        store.db,
        '01J9QW7B6N5W2YH3D3A1V0KE2T',
        new Date('2026-05-12T00:00:00.000Z'),
      ),
    ).rejects.toBeInstanceOf(UserDeletionBlockedByLegalHoldError);

    expect(store.anonymizedUsers).toEqual([]);
    expect(store.deletedCredentialUserIds).toEqual([]);
    expect(store.deletedSessionUserIds).toEqual([]);
    expect(store.redactedAuditLogs).toEqual([]);
  });

  it('stores the retained-until deadline when anonymizing a preserved deleted user', async () => {
    const store = createAuthAdminDb();
    const now = new Date('2026-05-12T00:00:00.000Z');
    const retainUntil = new Date('2027-05-12T00:00:00.000Z');

    const user = await anonymizeAuthUserForDeletion(
      store.db,
      '01J9QW7B6N5W2YH3D3A1V0KE2T',
      now,
      retainUntil,
    );

    expect(user).toMatchObject({
      status: 'deleted',
      deletedAt: now,
      retainUntil,
    });
    expect(store.anonymizedUsers).toEqual([
      expect.objectContaining({
        deletedAt: now,
        retainUntil,
      }),
    ]);
  });
});
