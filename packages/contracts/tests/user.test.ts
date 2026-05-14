import { describe, expect, it } from 'vitest';
import { RetentionPolicy, User, UserLegalHold } from '../src/user.ts';

describe('user contracts', () => {
  it('models active and preserved-deleted account state', () => {
    const createdAt = new Date('2026-05-01T00:00:00.000Z');
    const deletedAt = new Date('2026-05-12T00:00:00.000Z');

    expect(
      User.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
        email: 'deleted+01j9qw7b6n5w2yh3d3a1v0ke2w@deleted.openlms.local',
        displayName: 'Deleted user',
        emailVerified: false,
        status: 'deleted',
        deletedAt,
        locale: null,
        timezone: null,
        createdAt,
        updatedAt: deletedAt,
      }),
    ).toMatchObject({
      status: 'deleted',
      deletedAt,
      retainUntil: null,
    });

    expect(
      User.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
        email: 'user@example.com',
        displayName: 'Sample User',
        emailVerified: true,
        status: 'active',
        deletedAt: null,
        locale: null,
        timezone: null,
        createdAt,
        updatedAt: createdAt,
      }),
    ).toMatchObject({
      status: 'active',
      deletedAt: null,
      retainUntil: null,
    });
  });

  it('models tenant-scoped legal holds for deletion retention checks', () => {
    const createdAt = new Date('2026-05-12T00:00:00.000Z');

    expect(
      UserLegalHold.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE90',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE91',
        userId: '01J9QW7B6N5W2YH3D3A1V0KE92',
        createdById: '01J9QW7B6N5W2YH3D3A1V0KE93',
        reason: 'Active grade appeal retention hold',
        releasedAt: null,
        createdAt,
        updatedAt: createdAt,
      }),
    ).toMatchObject({
      reason: 'Active grade appeal retention hold',
      releasedAt: null,
    });
  });

  it('models tenant retention policies for preserved deleted users', () => {
    const createdAt = new Date('2026-05-14T00:00:00.000Z');

    expect(
      RetentionPolicy.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE94',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE91',
        targetType: 'deleted_user',
        retainDays: 365,
        createdAt,
        updatedAt: createdAt,
      }),
    ).toMatchObject({
      targetType: 'deleted_user',
      retainDays: 365,
    });
  });
});
