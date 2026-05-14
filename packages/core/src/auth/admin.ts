import { User, type User as UserContract, UserId } from '@openlms/contracts';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { auditLog } from '../db/schema/audit.ts';
import { type UserRow, account, session, user } from '../db/schema/auth.ts';
import { userLegalHold } from '../db/schema/legal-hold.ts';

export class UserDeletionBlockedByLegalHoldError extends Error {
  constructor(userId: string) {
    super(`User ${userId} cannot be deleted while an active legal hold exists.`);
    this.name = 'UserDeletionBlockedByLegalHoldError';
  }
}

export const deleteAuthUserById = async (db: Database, userId: string): Promise<void> => {
  await db.delete(user).where(eq(user.id, UserId.parse(userId)));
};

const toUserContract = (row: UserRow): UserContract =>
  User.parse({
    id: row.id,
    email: row.email,
    displayName: row.name,
    emailVerified: row.emailVerified,
    status: row.status,
    deletedAt: row.deletedAt,
    retainUntil: row.retainUntil,
    locale: row.locale,
    timezone: row.timezone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const anonymizeAuthUserForDeletion = async (
  db: Database,
  userId: string,
  now = new Date(),
  retainUntil: Date | null = null,
): Promise<UserContract | null> => {
  const parsedUserId = UserId.parse(userId);
  const deletedEmail = `deleted+${parsedUserId.toLowerCase()}@deleted.openlms.local`;

  return db.transaction(async (transaction) => {
    const [activeLegalHold] = await transaction
      .select()
      .from(userLegalHold)
      .where(and(eq(userLegalHold.userId, parsedUserId), isNull(userLegalHold.releasedAt)))
      .limit(1);

    if (activeLegalHold) {
      throw new UserDeletionBlockedByLegalHoldError(parsedUserId);
    }

    const [existingUser] = await transaction
      .select()
      .from(user)
      .where(eq(user.id, parsedUserId))
      .limit(1);

    if (!existingUser) {
      return null;
    }

    const [row] = await transaction
      .update(user)
      .set({
        email: deletedEmail,
        emailVerified: false,
        name: 'Deleted user',
        image: null,
        locale: null,
        timezone: null,
        status: 'deleted',
        deletedAt: now,
        retainUntil,
        updatedAt: now,
      })
      .where(eq(user.id, parsedUserId))
      .returning();

    if (!row) {
      return null;
    }

    await transaction.delete(account).where(eq(account.userId, parsedUserId));
    await transaction.delete(session).where(eq(session.userId, parsedUserId));

    const metadataPatterns = [parsedUserId, existingUser.email, existingUser.name].map(
      (value) => `%${value}%`,
    );

    await transaction
      .update(auditLog)
      .set({
        actorId: null,
        metadata: {
          redacted: true,
          redactedAt: now.toISOString(),
          redactedReason: 'user_deleted',
        },
      })
      .where(
        or(
          eq(auditLog.actorId, parsedUserId),
          ...metadataPatterns.map((pattern) => sql`${auditLog.metadata}::text LIKE ${pattern}`),
        ),
      );

    return toUserContract(row);
  });
};

export const getUserById = async (db: Database, userId: string): Promise<UserContract | null> => {
  const [row] = await db
    .select()
    .from(user)
    .where(eq(user.id, UserId.parse(userId)))
    .limit(1);

  return row ? toUserContract(row) : null;
};

export type UpdateUserProfileInput = {
  displayName?: string;
  locale?: string | null;
  timezone?: string | null;
};

export const updateUserProfile = async (
  db: Database,
  userId: string,
  input: UpdateUserProfileInput,
  now = new Date(),
): Promise<UserContract | null> => {
  const updates: Partial<UserRow> = { updatedAt: now };

  if (input.displayName !== undefined) {
    updates.name = input.displayName;
  }
  if (input.locale !== undefined) {
    updates.locale = input.locale;
  }
  if (input.timezone !== undefined) {
    updates.timezone = input.timezone;
  }

  const [row] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, UserId.parse(userId)))
    .returning();

  return row ? toUserContract(row) : null;
};
