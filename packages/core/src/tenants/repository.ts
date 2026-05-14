import { Tenant, type Tenant as TenantContract, TenantId, TenantSlug } from '@openlms/contracts';
import { asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { type TenantRow, tenant } from '../db/schema/tenant.ts';

export type CreateTenantInput = {
  slug: string;
  displayName: string;
};

export type UpdateTenantFileStorageQuotasInput = {
  tenantId: string;
  storageByteLimit: number | null;
  defaultUserStorageByteLimit: number | null;
};

const toTenant = (row: TenantRow): TenantContract =>
  Tenant.parse({
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    storageByteLimit: row.storageByteLimit,
    defaultUserStorageByteLimit: row.defaultUserStorageByteLimit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const createTenant = async (
  db: Database,
  input: CreateTenantInput,
): Promise<TenantContract> => {
  const id = TenantId.parse(ulid());
  const slug = TenantSlug.parse(input.slug);
  const [row] = await db
    .insert(tenant)
    .values({
      id,
      slug,
      displayName: input.displayName,
    })
    .returning();

  if (!row) {
    throw new Error('Tenant could not be created because the database returned no row.');
  }

  return toTenant(row);
};

export const getTenantById = async (db: Database, id: string): Promise<TenantContract | null> => {
  const [row] = await db.select().from(tenant).where(eq(tenant.id, id)).limit(1);
  return row ? toTenant(row) : null;
};

export const getTenantBySlug = async (
  db: Database,
  slug: string,
): Promise<TenantContract | null> => {
  const parsedSlug = TenantSlug.parse(slug);
  const [row] = await db.select().from(tenant).where(eq(tenant.slug, parsedSlug)).limit(1);
  return row ? toTenant(row) : null;
};

export const listTenants = async (db: Database): Promise<TenantContract[]> => {
  const rows = await db.select().from(tenant).orderBy(asc(tenant.createdAt));
  return rows.map(toTenant);
};

export const updateTenantFileStorageQuotas = async (
  db: Database,
  input: UpdateTenantFileStorageQuotasInput,
  now = new Date(),
): Promise<TenantContract | null> => {
  const [row] = await db
    .update(tenant)
    .set({
      storageByteLimit: input.storageByteLimit,
      defaultUserStorageByteLimit: input.defaultUserStorageByteLimit,
      updatedAt: now,
    })
    .where(eq(tenant.id, input.tenantId))
    .returning();

  return row ? toTenant(row) : null;
};
