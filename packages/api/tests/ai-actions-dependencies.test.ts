import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEH0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEH1';

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('AI actions registry API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
  });

  it('returns registered AI actions for tenant staff', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    const actions = await dependencies.listAiActions(actorUserId, tenantId);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions.map((action) => action.identifier)).toContain('feedback_draft');
    expect(actions[0]).toMatchObject({
      identifier: expect.any(String),
      riskLevel: expect.any(String),
    });
  });

  it('returns registered AI actions for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(dependencies.listAiActions(actorUserId, tenantId)).resolves.toEqual(
      expect.any(Array),
    );
  });

  it('rejects students with forbidden', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    await expect(dependencies.listAiActions(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('rejects non-tenant members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(dependencies.listAiActions(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
