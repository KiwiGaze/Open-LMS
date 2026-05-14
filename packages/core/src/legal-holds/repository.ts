import {
  TenantId,
  UserId,
  UserLegalHold,
  type UserLegalHold as UserLegalHoldContract,
  UserLegalHoldId,
} from '@openlms/contracts';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { userLegalHold } from '../db/schema/legal-hold.ts';

export type UserLegalHoldStatus = 'active' | 'released' | 'all';

export type ListUserLegalHoldsInput = {
  tenantId: string;
  userId?: string;
  status?: UserLegalHoldStatus;
};

export const listUserLegalHolds = async (
  db: Database,
  input: ListUserLegalHoldsInput,
): Promise<UserLegalHoldContract[]> => {
  const conditions = [eq(userLegalHold.tenantId, TenantId.parse(input.tenantId))];

  if (input.userId !== undefined) {
    conditions.push(eq(userLegalHold.userId, UserId.parse(input.userId)));
  }

  if (input.status === 'active' || input.status === undefined) {
    conditions.push(isNull(userLegalHold.releasedAt));
  } else if (input.status === 'released') {
    conditions.push(isNotNull(userLegalHold.releasedAt));
  }

  const rows = await db
    .select()
    .from(userLegalHold)
    .where(and(...conditions))
    .orderBy(desc(userLegalHold.createdAt));

  return rows.map((row) => UserLegalHold.parse(row));
};

export type CreateUserLegalHoldInput = {
  tenantId: string;
  userId: string;
  createdById: string | null;
  reason: string;
};

export const createUserLegalHold = async (
  db: Database,
  input: CreateUserLegalHoldInput,
  now = new Date(),
): Promise<UserLegalHoldContract> => {
  const [row] = await db
    .insert(userLegalHold)
    .values({
      id: UserLegalHoldId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      userId: UserId.parse(input.userId),
      createdById: input.createdById ? UserId.parse(input.createdById) : null,
      reason: input.reason,
      releasedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) {
    throw new Error('User legal hold could not be saved because the database returned no row.');
  }

  return UserLegalHold.parse(row);
};

export type ReleaseUserLegalHoldInput = {
  tenantId: string;
  legalHoldId: string;
  releasedAt?: Date;
};

export const releaseUserLegalHold = async (
  db: Database,
  input: ReleaseUserLegalHoldInput,
): Promise<UserLegalHoldContract | null> => {
  const releasedAt = input.releasedAt ?? new Date();
  const [row] = await db
    .update(userLegalHold)
    .set({ releasedAt, updatedAt: releasedAt })
    .where(
      and(
        eq(userLegalHold.tenantId, TenantId.parse(input.tenantId)),
        eq(userLegalHold.id, UserLegalHoldId.parse(input.legalHoldId)),
        isNull(userLegalHold.releasedAt),
      ),
    )
    .returning();

  return row ? UserLegalHold.parse(row) : null;
};

export const isUserLegalHoldActiveDuplicate = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const value = error as { code?: unknown; constraint_name?: unknown; constraint?: unknown };
  return (
    value.code === '23505' &&
    (value.constraint_name === 'user_legal_hold_active_user_tenant_uq' ||
      value.constraint === 'user_legal_hold_active_user_tenant_uq')
  );
};
