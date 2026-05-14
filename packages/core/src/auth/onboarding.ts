import { Tenant, TenantId, TenantSlug, UserId } from '@openlms/contracts';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { tenantMembership } from '../db/schema/membership.ts';
import { tenant as tenantTable } from '../db/schema/tenant.ts';

export class TenantSlugTakenError extends Error {
  constructor(slug: string) {
    super(`Tenant slug "${slug}" is already taken. Choose a different institution slug.`);
    this.name = 'TenantSlugTakenError';
  }
}

export type SignUpWithTenantInput = {
  userId: string;
  tenantSlug: string;
  tenantDisplayName: string;
};

export type SignUpWithTenantResult = {
  tenant: Tenant;
};

export const signUpWithTenant = async (
  db: Database,
  input: SignUpWithTenantInput,
): Promise<SignUpWithTenantResult> => {
  const slug = TenantSlug.parse(input.tenantSlug);
  const userId = UserId.parse(input.userId);
  const tenantId = TenantId.parse(ulid());

  return db.transaction(async (tx) => {
    const [tenantRow] = await tx
      .insert(tenantTable)
      .values({
        id: tenantId,
        slug,
        displayName: input.tenantDisplayName,
      })
      .onConflictDoNothing({ target: tenantTable.slug })
      .returning();

    if (!tenantRow) {
      throw new TenantSlugTakenError(slug);
    }

    await tx
      .insert(tenantMembership)
      .values({
        id: ulid(),
        tenantId: tenantRow.id,
        userId,
        role: 'institution_admin',
      })
      .returning();

    return {
      tenant: Tenant.parse({
        id: tenantRow.id,
        slug: tenantRow.slug,
        displayName: tenantRow.displayName,
        createdAt: tenantRow.createdAt,
        updatedAt: tenantRow.updatedAt,
      }),
    };
  });
};
