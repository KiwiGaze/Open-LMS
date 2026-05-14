import {
  RetentionPolicy,
  type RetentionPolicy as RetentionPolicyContract,
  RetentionPolicyId,
  type RetentionPolicyTargetType,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { retentionPolicy } from '../db/schema/retention.ts';

export const listRetentionPolicies = async (
  db: Database,
  tenantId: string,
): Promise<RetentionPolicyContract[]> => {
  const rows = await db
    .select()
    .from(retentionPolicy)
    .where(eq(retentionPolicy.tenantId, TenantId.parse(tenantId)))
    .orderBy(asc(retentionPolicy.targetType));

  return rows.map((row) => RetentionPolicy.parse(row));
};

export const getRetentionPolicy = async (
  db: Database,
  tenantId: string,
  targetType: RetentionPolicyTargetType,
): Promise<RetentionPolicyContract | null> => {
  const [row] = await db
    .select()
    .from(retentionPolicy)
    .where(
      and(
        eq(retentionPolicy.tenantId, TenantId.parse(tenantId)),
        eq(retentionPolicy.targetType, targetType),
      ),
    )
    .limit(1);

  return row ? RetentionPolicy.parse(row) : null;
};

export type UpsertRetentionPolicyInput = {
  tenantId: string;
  targetType: RetentionPolicyTargetType;
  retainDays: number;
};

export const upsertRetentionPolicy = async (
  db: Database,
  input: UpsertRetentionPolicyInput,
  now = new Date(),
): Promise<RetentionPolicyContract> => {
  const policy = RetentionPolicy.parse({
    id: RetentionPolicyId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    targetType: input.targetType,
    retainDays: input.retainDays,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(retentionPolicy)
    .values(policy)
    .onConflictDoUpdate({
      target: [retentionPolicy.tenantId, retentionPolicy.targetType],
      set: {
        retainDays: policy.retainDays,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error('Retention policy could not be saved because the database returned no row.');
  }

  return RetentionPolicy.parse(row);
};

export const calculateUserRetainUntil = (
  deletedAt: Date,
  policy: RetentionPolicyContract | null,
): Date | null => {
  if (!policy) {
    return null;
  }

  return new Date(deletedAt.getTime() + policy.retainDays * 24 * 60 * 60 * 1000);
};
