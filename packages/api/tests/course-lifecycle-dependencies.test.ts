import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
  restoreDeletedCourse: vi.fn(),
  softDeleteCourse: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    restoreDeletedCourse: coreMocks.restoreDeletedCourse,
    softDeleteCourse: coreMocks.softDeleteCourse,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const now = new Date('2026-05-13T12:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantMembership = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role === null ? [] : [{ tenantId, role }]);
};

const sampleCourse = (status: 'draft' | 'deleted', deletedAt: Date | null) => ({
  id: courseId,
  tenantId,
  code: 'WRIT-101',
  title: 'Evidence-Based Writing',
  status,
  startsAt: null,
  endsAt: null,
  catalogCategory: null,
  academicTerm: null,
  maxEnrollments: null,
  waitlistEnabled: false,
  isBlueprint: false,
  deletedAt,
  createdAt: now,
  updatedAt: now,
});

describe('course lifecycle API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.softDeleteCourse.mockResolvedValue(sampleCourse('deleted', now));
    coreMocks.restoreDeletedCourse.mockResolvedValue(sampleCourse('draft', null));
  });

  it('soft-deletes courses for tenant staff', async () => {
    configureTenantMembership('institution_admin');
    const dependencies = createDependencies();

    await expect(dependencies.deleteCourse(actorUserId, tenantId, courseId)).resolves.toBe(
      undefined,
    );

    expect(coreMocks.softDeleteCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('rejects non-staff course soft-delete', async () => {
    configureTenantMembership('student');
    const dependencies = createDependencies();

    await expect(dependencies.deleteCourse(actorUserId, tenantId, courseId)).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only tenant staff can delete courses. Ask an institution administrator for access.',
    });

    expect(coreMocks.softDeleteCourse).not.toHaveBeenCalled();
  });

  it('maps missing course soft-delete to not found', async () => {
    configureTenantMembership('institution_admin');
    coreMocks.softDeleteCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(dependencies.deleteCourse(actorUserId, tenantId, courseId)).rejects.toMatchObject({
      code: 'not_found',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('restores deleted courses for tenant staff', async () => {
    configureTenantMembership('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreDeletedCourse(actorUserId, tenantId, courseId),
    ).resolves.toEqual(sampleCourse('draft', null));

    expect(coreMocks.restoreDeletedCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('rejects non-staff deleted course restore', async () => {
    configureTenantMembership('student');
    const dependencies = createDependencies();

    await expect(
      dependencies.restoreDeletedCourse(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only tenant staff can restore courses. Ask an institution administrator for access.',
    });

    expect(coreMocks.restoreDeletedCourse).not.toHaveBeenCalled();
  });
});
