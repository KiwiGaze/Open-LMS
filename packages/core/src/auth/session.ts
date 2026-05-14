import { TenantId, UserId } from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../db/client.ts';
import { session as sessionTable, user as userTable } from '../db/schema/auth.ts';
import { tenantMembership } from '../db/schema/membership.ts';

export const CoreSession = z.object({
  userId: UserId,
  activeTenantId: TenantId.nullable(),
  expiresAt: z.date(),
});
export type CoreSession = z.infer<typeof CoreSession>;

export const assertActiveTenantSession = (session: CoreSession): TenantId => {
  if (session.expiresAt.getTime() <= Date.now()) {
    throw new Error('Session has expired. Sign in again and retry the request.');
  }

  if (!session.activeTenantId) {
    throw new Error('No active tenant is selected. Select an institution and retry the request.');
  }

  return session.activeTenantId;
};

export const setActiveTenant = async (
  db: Database,
  params: { sessionToken: string; userId: string; tenantId: string | null },
): Promise<void> => {
  const userId = UserId.parse(params.userId);
  const tenantId = params.tenantId ? TenantId.parse(params.tenantId) : null;

  if (tenantId) {
    const [membership] = await db
      .select({ id: tenantMembership.id })
      .from(tenantMembership)
      .where(and(eq(tenantMembership.userId, userId), eq(tenantMembership.tenantId, tenantId)))
      .limit(1);

    if (!membership) {
      throw new Error('User is not an active member of the requested tenant.');
    }
  }

  const updatedRows = await db
    .update(sessionTable)
    .set({ activeTenantId: tenantId })
    .where(and(eq(sessionTable.token, params.sessionToken), eq(sessionTable.userId, userId)))
    .returning({ id: sessionTable.id });

  if (updatedRows.length !== 1) {
    throw new Error('Session was not found for this user. Sign in again and retry.');
  }
};

export const getActiveTenantForSession = async (
  db: Database,
  sessionToken: string,
): Promise<string | null> => {
  const [row] = await db
    .select({ activeTenantId: sessionTable.activeTenantId })
    .from(sessionTable)
    .where(eq(sessionTable.token, sessionToken))
    .limit(1);

  return row?.activeTenantId ?? null;
};

export const getCoreSessionByToken = async (
  db: Database,
  sessionToken: string,
): Promise<CoreSession | null> => {
  const [row] = await db
    .select({
      userId: sessionTable.userId,
      activeTenantId: sessionTable.activeTenantId,
      expiresAt: sessionTable.expiresAt,
      userStatus: userTable.status,
      userDeletedAt: userTable.deletedAt,
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.token, sessionToken))
    .limit(1);

  if (!row || row.userStatus !== 'active' || row.userDeletedAt) {
    return null;
  }

  return CoreSession.parse(row);
};
