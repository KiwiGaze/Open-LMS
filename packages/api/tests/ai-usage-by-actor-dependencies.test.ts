import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAiUsageByActor: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAiUsageByActor: coreMocks.getAiUsageByActor,
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

describe('AI usage-by-actor API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAiUsageByActor.mockResolvedValue([
      {
        actorUserId: '01J9QW7B6N5W2YH3D3A1V0KEG2',
        actorName: 'Top Consumer',
        actorEmail: 'top@example.edu',
        callCount: 50,
        totalInputTokens: 20000,
        totalOutputTokens: 5000,
        estimatedCostCents: 22.5,
      },
      {
        actorUserId: null,
        actorName: null,
        actorEmail: null,
        callCount: 5,
        totalInputTokens: 500,
        totalOutputTokens: 100,
        estimatedCostCents: 0.5,
      },
    ]);
  });

  it('returns the per-actor breakdown for staff', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    const rows = await dependencies.listAiUsageByActor(actorUserId, tenantId, from, to);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ actorName: 'Top Consumer', callCount: 50 });
    expect(rows[1]).toMatchObject({ actorUserId: null });
    expect(coreMocks.getAiUsageByActor).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      from,
      to,
    });
  });

  it('rejects students with forbidden', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    await expect(
      dependencies.listAiUsageByActor(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.getAiUsageByActor).not.toHaveBeenCalled();
  });

  it('rejects non-members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAiUsageByActor(actorUserId, tenantId, from, to),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
