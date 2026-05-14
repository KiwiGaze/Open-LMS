import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
  upsertNotificationPreference: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    upsertNotificationPreference: coreMocks.upsertNotificationPreference,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEA0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEA1';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setTenantRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

describe('notification preference upsert API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.upsertNotificationPreference.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KEA2',
      tenantId,
      userId: actorUserId,
      category: 'feedback_published',
      channel: 'email',
      frequency: 'daily_digest',
      createdAt: now,
      updatedAt: now,
    });
    setTenantRole('student');
  });

  it('saves a preference for the authenticated user', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertNotificationPreference(actorUserId, tenantId, {
        category: 'feedback_published',
        channel: 'email',
        frequency: 'daily_digest',
      }),
    ).resolves.toMatchObject({
      userId: actorUserId,
      category: 'feedback_published',
      channel: 'email',
      frequency: 'daily_digest',
    });

    expect(coreMocks.upsertNotificationPreference).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: actorUserId,
      category: 'feedback_published',
      channel: 'email',
      frequency: 'daily_digest',
    });
  });

  it('rejects when the actor is not a tenant member', async () => {
    setTenantRole(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertNotificationPreference(actorUserId, tenantId, {
        category: 'feedback_published',
        channel: 'email',
        frequency: 'daily_digest',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.upsertNotificationPreference).not.toHaveBeenCalled();
  });

  it('passes the off frequency through unchanged', async () => {
    coreMocks.upsertNotificationPreference.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KEA3',
      tenantId,
      userId: actorUserId,
      category: 'grade_published',
      channel: 'in_app',
      frequency: 'off',
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    const saved = await dependencies.upsertNotificationPreference(actorUserId, tenantId, {
      category: 'grade_published',
      channel: 'in_app',
      frequency: 'off',
    });

    expect(saved.frequency).toBe('off');
  });

  it('saves push preferences for the authenticated user', async () => {
    coreMocks.upsertNotificationPreference.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KEA4',
      tenantId,
      userId: actorUserId,
      category: 'grade_published',
      channel: 'push',
      frequency: 'immediate',
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    const saved = await dependencies.upsertNotificationPreference(actorUserId, tenantId, {
      category: 'grade_published',
      channel: 'push',
      frequency: 'immediate',
    });

    expect(saved.channel).toBe('push');
    expect(coreMocks.upsertNotificationPreference).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      userId: actorUserId,
      category: 'grade_published',
      channel: 'push',
      frequency: 'immediate',
    });
  });
});
