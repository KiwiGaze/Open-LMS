import {
  Tenant,
  type Tenant as TenantContract,
  TenantMembership,
  type TenantMembership as TenantMembershipContract,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { TenantSlugTakenError, signUpWithTenant } from '../src/auth/onboarding.ts';
import type { Database } from '../src/db/client.ts';

type StoredTenant = TenantContract;
type StoredMembership = TenantMembershipContract;

const now = new Date('2026-05-10T00:00:00.000Z');
const userId = '01J9QW7B6N5W2YH3D3A1V0KE2T';

const createOnboardingDb = (options: { failMembershipForUserId?: string } = {}) => {
  const tenants: StoredTenant[] = [];
  const memberships: StoredMembership[] = [];

  const createTransaction = () => {
    const pendingTenants: StoredTenant[] = [];
    const pendingMemberships: StoredMembership[] = [];

    return {
      insert: () => ({
        values: (value: Record<string, unknown>) => {
          const insertTenant = () => ({
            onConflictDoNothing: () => ({
              returning: async () => {
                const slug = String(value.slug);
                if (
                  tenants.some((tenant) => tenant.slug === slug) ||
                  pendingTenants.some((tenant) => tenant.slug === slug)
                ) {
                  return [];
                }

                const tenant = Tenant.parse({
                  id: String(value.id),
                  slug,
                  displayName: String(value.displayName),
                  createdAt: now,
                  updatedAt: now,
                });
                pendingTenants.push(tenant);
                return [tenant];
              },
            }),
          });

          const insertMembership = () => ({
            returning: async () => {
              if (value.userId === options.failMembershipForUserId) {
                throw new Error(
                  'insert or update on table "tenant_membership" violates foreign key',
                );
              }

              const membership = TenantMembership.parse({
                id: String(value.id),
                tenantId: String(value.tenantId),
                userId: String(value.userId),
                role: value.role,
                createdAt: now,
                updatedAt: now,
              });
              pendingMemberships.push(membership);
              return [membership];
            },
          });

          return 'slug' in value ? insertTenant() : insertMembership();
        },
      }),
      commit: () => {
        tenants.push(...pendingTenants);
        memberships.push(...pendingMemberships);
      },
    };
  };

  const db = {
    transaction: async <T>(callback: (tx: ReturnType<typeof createTransaction>) => Promise<T>) => {
      const tx = createTransaction();
      const result = await callback(tx);
      tx.commit();
      return result;
    },
  } as unknown as Database;

  return {
    db,
    tenants,
    memberships,
  };
};

describe('tenant onboarding', () => {
  it('creates a new tenant and institution admin membership atomically', async () => {
    const store = createOnboardingDb();

    const result = await signUpWithTenant(store.db, {
      userId,
      tenantSlug: 'acme',
      tenantDisplayName: 'ACME College',
    });

    expect(result.tenant.slug).toBe('acme');
    expect(store.memberships).toEqual([
      expect.objectContaining({
        tenantId: result.tenant.id,
        userId,
        role: 'institution_admin',
      }),
    ]);
  });

  it('throws a typed error when slug already exists without creating membership', async () => {
    const store = createOnboardingDb();
    await signUpWithTenant(store.db, {
      userId,
      tenantSlug: 'acme',
      tenantDisplayName: 'ACME College',
    });

    await expect(
      signUpWithTenant(store.db, {
        userId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        tenantSlug: 'acme',
        tenantDisplayName: 'Ignored College',
      }),
    ).rejects.toBeInstanceOf(TenantSlugTakenError);

    expect(store.tenants).toHaveLength(1);
    expect(store.tenants[0]?.displayName).toBe('ACME College');
    expect(store.memberships).toHaveLength(1);
  });

  it('does not commit the tenant when admin membership creation fails', async () => {
    const ghostUserId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
    const store = createOnboardingDb({ failMembershipForUserId: ghostUserId });

    await expect(
      signUpWithTenant(store.db, {
        userId: ghostUserId,
        tenantSlug: 'rollback',
        tenantDisplayName: 'Rollback College',
      }),
    ).rejects.toThrow(/tenant_membership/);

    expect(store.tenants).toHaveLength(0);
    expect(store.memberships).toHaveLength(0);
  });
});
