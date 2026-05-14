import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listTenantMembers: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listTenantMembers: coreMocks.listTenantMembers,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEB0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEB1';
const otherUserId = '01J9QW7B6N5W2YH3D3A1V0KEB2';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('tenant members API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listTenantMembers.mockResolvedValue([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KEB3',
        tenantId,
        userId: actorUserId,
        role: 'instructor',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KEB4',
        tenantId,
        userId: otherUserId,
        role: 'student',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  it('returns tenant members for staff', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    const members = await dependencies.listTenantMembers(actorUserId, tenantId);

    expect(members).toHaveLength(2);
    expect(coreMocks.listTenantMembers).toHaveBeenCalledWith(coreMocks.dbHandle.db, tenantId);
  });

  it('returns tenant members for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(dependencies.listTenantMembers(actorUserId, tenantId)).resolves.toHaveLength(2);
  });

  it('rejects students with forbidden', async () => {
    setActorRole('student');
    const dependencies = createDependencies();

    await expect(dependencies.listTenantMembers(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(coreMocks.listTenantMembers).not.toHaveBeenCalled();
  });

  it('rejects non-members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(dependencies.listTenantMembers(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
