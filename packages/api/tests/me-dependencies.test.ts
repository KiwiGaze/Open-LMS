import { UserDeletionBlockedByLegalHoldError } from '@openlms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  anonymizeAuthUserForDeletion: vi.fn(),
  calculateUserRetainUntil: vi.fn(),
  getRetentionPolicy: vi.fn(),
  getUserById: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    anonymizeAuthUserForDeletion: coreMocks.anonymizeAuthUserForDeletion,
    calculateUserRetainUntil: coreMocks.calculateUserRetainUntil,
    getRetentionPolicy: coreMocks.getRetentionPolicy,
    getUserById: coreMocks.getUserById,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateUserProfile: coreMocks.updateUserProfile,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const firstTenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const secondTenantId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const now = new Date('2026-05-12T00:00:00.000Z');

const sampleUser = (overrides?: Partial<Record<string, unknown>>) => ({
  id: actorUserId,
  email: 'user@example.com',
  displayName: 'Jordan Lee',
  emailVerified: true,
  status: 'active',
  deletedAt: null,
  locale: null,
  timezone: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

describe('current-user API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listUserTenantMemberships.mockResolvedValue([]);
    coreMocks.getRetentionPolicy.mockResolvedValue(null);
    coreMocks.calculateUserRetainUntil.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the authenticated user profile', async () => {
    coreMocks.getUserById.mockResolvedValue(sampleUser());
    const dependencies = createDependencies();

    await expect(dependencies.getCurrentUser(actorUserId)).resolves.toMatchObject({
      id: actorUserId,
      displayName: 'Jordan Lee',
      locale: null,
      timezone: null,
    });

    expect(coreMocks.getUserById).toHaveBeenCalledWith(coreMocks.dbHandle.db, actorUserId);
  });

  it('throws unauthorized when the authenticated user no longer exists', async () => {
    coreMocks.getUserById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(dependencies.getCurrentUser(actorUserId)).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('updates display name, locale, and timezone', async () => {
    coreMocks.updateUserProfile.mockResolvedValue(
      sampleUser({ displayName: 'Jordan L', locale: 'en-US', timezone: 'America/New_York' }),
    );
    const dependencies = createDependencies();

    const updated = await dependencies.updateCurrentUser(actorUserId, {
      displayName: 'Jordan L',
      locale: 'en-US',
      timezone: 'America/New_York',
    });

    expect(updated).toMatchObject({
      displayName: 'Jordan L',
      locale: 'en-US',
      timezone: 'America/New_York',
    });
    expect(coreMocks.updateUserProfile).toHaveBeenCalledWith(coreMocks.dbHandle.db, actorUserId, {
      displayName: 'Jordan L',
      locale: 'en-US',
      timezone: 'America/New_York',
    });
  });

  it('allows clearing locale and timezone with explicit null', async () => {
    coreMocks.updateUserProfile.mockResolvedValue(sampleUser());
    const dependencies = createDependencies();

    await dependencies.updateCurrentUser(actorUserId, { locale: null, timezone: null });

    expect(coreMocks.updateUserProfile).toHaveBeenCalledWith(coreMocks.dbHandle.db, actorUserId, {
      locale: null,
      timezone: null,
    });
  });

  it('throws unauthorized when updating a user that no longer exists', async () => {
    coreMocks.updateUserProfile.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCurrentUser(actorUserId, { displayName: 'New Name' }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('deletes the authenticated user account by anonymizing the preserved user row', async () => {
    coreMocks.anonymizeAuthUserForDeletion.mockResolvedValue(
      sampleUser({
        email: 'deleted+01j9qw7b6n5w2yh3d3a1v0ke84@deleted.openlms.local',
        displayName: 'Deleted user',
        emailVerified: false,
        status: 'deleted',
        deletedAt: now,
      }),
    );
    const dependencies = createDependencies();

    await expect(dependencies.deleteCurrentUser(actorUserId)).resolves.toBeUndefined();

    expect(coreMocks.anonymizeAuthUserForDeletion).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      actorUserId,
      expect.any(Date),
      null,
    );
  });

  it('applies the latest configured tenant retention deadline when deleting the authenticated user', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const firstRetainUntil = new Date('2026-06-11T00:00:00.000Z');
    const secondRetainUntil = new Date('2027-05-12T00:00:00.000Z');
    coreMocks.listUserTenantMemberships.mockResolvedValue([
      { tenantId: firstTenantId, userId: actorUserId, role: 'student' },
      { tenantId: secondTenantId, userId: actorUserId, role: 'student' },
    ]);
    coreMocks.getRetentionPolicy.mockImplementation(async (_db: unknown, tenantId: string) =>
      tenantId === firstTenantId
        ? { tenantId, targetType: 'deleted_user', retainDays: 30 }
        : { tenantId, targetType: 'deleted_user', retainDays: 365 },
    );
    coreMocks.calculateUserRetainUntil.mockImplementation((_deletedAt: Date, policy: unknown) =>
      (policy as { retainDays: number }).retainDays === 30 ? firstRetainUntil : secondRetainUntil,
    );
    coreMocks.anonymizeAuthUserForDeletion.mockResolvedValue(
      sampleUser({
        email: 'deleted+01j9qw7b6n5w2yh3d3a1v0ke84@deleted.openlms.local',
        displayName: 'Deleted user',
        emailVerified: false,
        status: 'deleted',
        deletedAt: now,
        retainUntil: secondRetainUntil,
      }),
    );
    const dependencies = createDependencies();

    await expect(dependencies.deleteCurrentUser(actorUserId)).resolves.toBeUndefined();

    expect(coreMocks.listUserTenantMemberships).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      actorUserId,
    );
    expect(coreMocks.getRetentionPolicy).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      firstTenantId,
      'deleted_user',
    );
    expect(coreMocks.getRetentionPolicy).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      secondTenantId,
      'deleted_user',
    );
    expect(coreMocks.anonymizeAuthUserForDeletion).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      actorUserId,
      now,
      secondRetainUntil,
    );
  });

  it('throws unauthorized when deleting a user that no longer exists', async () => {
    coreMocks.anonymizeAuthUserForDeletion.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(dependencies.deleteCurrentUser(actorUserId)).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('throws forbidden when account deletion is blocked by an active legal hold', async () => {
    coreMocks.anonymizeAuthUserForDeletion.mockRejectedValue(
      new UserDeletionBlockedByLegalHoldError(actorUserId),
    );
    const dependencies = createDependencies();

    await expect(dependencies.deleteCurrentUser(actorUserId)).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'This account cannot be deleted while an active legal hold exists. Contact an administrator to resolve the hold.',
    });
  });
});
