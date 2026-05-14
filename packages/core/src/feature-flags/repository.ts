import {
  FeatureFlagKey,
  TenantFeatureFlag,
  type TenantFeatureFlag as TenantFeatureFlagContract,
  TenantFeatureFlagId,
  TenantId,
} from '@openlms/contracts';
import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { type TenantFeatureFlagRow, tenantFeatureFlag } from '../db/schema/feature-flag.ts';

export type UpsertTenantFeatureFlagInput = {
  tenantId: string;
  key: string;
  enabled: boolean;
  description: string | null;
};

const toTenantFeatureFlag = (row: TenantFeatureFlagRow): TenantFeatureFlagContract =>
  TenantFeatureFlag.parse({
    id: row.id,
    tenantId: row.tenantId,
    key: row.key,
    enabled: row.enabled,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const listTenantFeatureFlags = async (
  db: Database,
  tenantId: string,
): Promise<TenantFeatureFlagContract[]> => {
  const rows = await db
    .select()
    .from(tenantFeatureFlag)
    .where(eq(tenantFeatureFlag.tenantId, TenantId.parse(tenantId)))
    .orderBy(tenantFeatureFlag.key);

  return rows.map(toTenantFeatureFlag);
};

export const upsertTenantFeatureFlag = async (
  db: Database,
  input: UpsertTenantFeatureFlagInput,
  now = new Date(),
): Promise<TenantFeatureFlagContract> => {
  const tenantId = TenantId.parse(input.tenantId);
  const key = FeatureFlagKey.parse(input.key);
  const description = TenantFeatureFlag.shape.description.parse(input.description);
  const [row] = await db
    .insert(tenantFeatureFlag)
    .values({
      id: TenantFeatureFlagId.parse(ulid()),
      tenantId,
      key,
      enabled: input.enabled,
      description,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [tenantFeatureFlag.tenantId, tenantFeatureFlag.key],
      set: {
        enabled: input.enabled,
        description,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error('Feature flag could not be saved because the database returned no row.');
  }

  return toTenantFeatureFlag(row);
};

export const deleteTenantFeatureFlag = async (
  db: Database,
  tenantId: string,
  key: string,
): Promise<boolean> => {
  const rows = await db
    .delete(tenantFeatureFlag)
    .where(
      and(
        eq(tenantFeatureFlag.tenantId, TenantId.parse(tenantId)),
        eq(tenantFeatureFlag.key, FeatureFlagKey.parse(key)),
      ),
    )
    .returning({ id: tenantFeatureFlag.id });

  return rows.length > 0;
};
