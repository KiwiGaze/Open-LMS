import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAiUsageSummary: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAiUsageSummary: coreMocks.getAiUsageSummary,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEF0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEF1';
const from = new Date('2026-04-01T00:00:00.000Z');
const to = new Date('2026-05-01T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('AI usage summary API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAiUsageSummary.mockResolvedValue({
      tenantId,
      from,
      to,
      totalCalls: 42,
      totalInputTokens: 12000,
      totalOutputTokens: 4500,
      totalDurationMs: 86400,
      totalRetryCount: 3,
      fallbackCount: 1,
      estimatedCostCents: 18.5,
    });
  });

  it('returns the summary for tenant staff', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.getAiUsageSummary(actorUserId, tenantId, from, to),
    ).resolves.toMatchObject({
      tenantId,
      totalCalls: 42,
      totalInputTokens: 12000,
      totalOutputTokens: 4500,
      estimatedCostCents: 18.5,
    });

    expect(coreMocks.getAiUsageSummary).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      from,
      to,
    });
  });

  it('returns the summary for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.getAiUsageSummary(actorUserId, tenantId, from, to),
    ).resolves.toMatchObject({ totalCalls: 42 });
  });

  it('rejects students with forbidden', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    await expect(
      dependencies.getAiUsageSummary(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getAiUsageSummary).not.toHaveBeenCalled();
  });

  it('rejects non-members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.getAiUsageSummary(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
