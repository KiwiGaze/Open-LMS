import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourse: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourse: coreMocks.createCourse,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const now = new Date('2026-05-10T00:00:00.000Z');
const startsAt = new Date('2026-08-25T00:00:00.000Z');
const endsAt = new Date('2026-12-15T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantMembership = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role === null ? [] : [{ tenantId, role }]);
};

describe('course creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourse.mockResolvedValue({
      id: courseId,
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
      startsAt,
      endsAt,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('creates courses for tenant staff (instructor)', async () => {
    configureTenantMembership('instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourse(actorUserId, tenantId, {
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt,
        endsAt,
        isBlueprint: true,
      }),
    ).resolves.toMatchObject({
      id: courseId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
    });

    expect(coreMocks.createCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      code: 'WRIT-101',
      title: 'Evidence-Based Writing',
      status: 'draft',
      startsAt,
      endsAt,
      isBlueprint: true,
    });
  });

  it('creates courses for tenant staff (institution_admin)', async () => {
    configureTenantMembership('institution_admin');
    const dependencies = createDependencies();

    await dependencies.createCourse(actorUserId, tenantId, {
      code: 'WRIT-201',
      title: 'Advanced Writing Workshop',
      status: 'active',
      startsAt: null,
      endsAt: null,
    });

    expect(coreMocks.createCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      code: 'WRIT-201',
      title: 'Advanced Writing Workshop',
      status: 'active',
      startsAt: null,
      endsAt: null,
    });
  });

  it('rejects students creating courses', async () => {
    configureTenantMembership('student');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourse(actorUserId, tenantId, {
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt,
        endsAt,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only tenant staff can create courses. Ask an institution administrator for access.',
    });

    expect(coreMocks.createCourse).not.toHaveBeenCalled();
  });

  it('rejects non-tenant-members creating courses', async () => {
    configureTenantMembership(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourse(actorUserId, tenantId, {
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt,
        endsAt,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only tenant staff can create courses. Ask an institution administrator for access.',
    });

    expect(coreMocks.createCourse).not.toHaveBeenCalled();
  });

  it('maps duplicate course codes to a conflict', async () => {
    configureTenantMembership('institution_admin');
    coreMocks.createCourse.mockRejectedValue({
      code: '23505',
      constraint_name: 'course_tenant_code_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourse(actorUserId, tenantId, {
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'draft',
        startsAt,
        endsAt,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Course code already exists in this tenant. Choose a unique code and retry the request.',
    });
  });
});
