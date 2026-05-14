import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  favoriteCourse: vi.fn(),
  listCourseFavoritesForUser: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  unfavoriteCourse: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    favoriteCourse: coreMocks.favoriteCourse,
    listCourseFavoritesForUser: coreMocks.listCourseFavoritesForUser,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    unfavoriteCourse: coreMocks.unfavoriteCourse,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const favoriteId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

const sampleFavorite = () => ({
  id: favoriteId,
  tenantId,
  courseId,
  userId: actorUserId,
  createdAt: now,
});

describe('course favorites API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.favoriteCourse.mockResolvedValue(sampleFavorite());
    coreMocks.listCourseFavoritesForUser.mockResolvedValue([sampleFavorite()]);
  });

  it('lets a course member favorite the course', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.favoriteCourse(actorUserId, tenantId, courseId),
    ).resolves.toMatchObject({ id: favoriteId, courseId, userId: actorUserId });

    expect(coreMocks.favoriteCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: actorUserId,
    });
  });

  it('rejects favorite when the actor is not a course member', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.favoriteCourse(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.favoriteCourse).not.toHaveBeenCalled();
  });

  it('allows unfavoriting even without course membership (tenant membership suffices)', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await dependencies.unfavoriteCourse(actorUserId, tenantId, courseId);

    expect(coreMocks.unfavoriteCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: actorUserId,
    });
  });

  it('rejects unfavorite when the actor is not a tenant member', async () => {
    coreMocks.listUserTenantMemberships.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.unfavoriteCourse(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.unfavoriteCourse).not.toHaveBeenCalled();
  });

  it('lists favorites for the authenticated user only', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    const favorites = await dependencies.listCourseFavorites(actorUserId, tenantId);

    expect(favorites).toHaveLength(1);
    expect(favorites[0]).toMatchObject({ userId: actorUserId, courseId });
    expect(coreMocks.listCourseFavoritesForUser).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      actorUserId,
    );
  });
});
