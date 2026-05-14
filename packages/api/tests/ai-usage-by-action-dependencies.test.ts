import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAiUsageByAction: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAiUsageByAction: coreMocks.getAiUsageByAction,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEG0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEG1';
const from = new Date('2026-04-01T00:00:00.000Z');
const to = new Date('2026-05-01T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('AI usage-by-action API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAiUsageByAction.mockResolvedValue([
      {
        actionIdentifier: 'feedback_draft',
        callCount: 20,
        totalInputTokens: 10000,
        totalOutputTokens: 3000,
        estimatedCostCents: 12,
      },
      {
        actionIdentifier: 'submission_precheck',
        callCount: 30,
        totalInputTokens: 5000,
        totalOutputTokens: 1500,
        estimatedCostCents: 6.5,
      },
    ]);
  });

  it('returns the per-action breakdown for staff', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    const rows = await dependencies.listAiUsageByAction(actorUserId, tenantId, from, to);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ actionIdentifier: 'feedback_draft', callCount: 20 });
    expect(coreMocks.getAiUsageByAction).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      from,
      to,
    });
  });

  it('returns rows for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.listAiUsageByAction(actorUserId, tenantId, from, to),
    ).resolves.toHaveLength(2);
  });

  it('rejects students with forbidden', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    await expect(
      dependencies.listAiUsageByAction(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getAiUsageByAction).not.toHaveBeenCalled();
  });

  it('rejects non-members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAiUsageByAction(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
