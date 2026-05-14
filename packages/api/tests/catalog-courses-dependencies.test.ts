import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listCatalogCoursesForTenant: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listCatalogCoursesForTenant: coreMocks.listCatalogCoursesForTenant,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const startsAt = new Date('2026-08-25T00:00:00.000Z');
const endsAt = new Date('2026-12-15T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

describe('catalog course listing API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCatalogCoursesForTenant.mockResolvedValue([
      {
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        catalogCategory: 'Writing',
        academicTerm: '2026 Fall',
        startsAt,
        endsAt,
      },
    ]);
  });

  it('lists catalog courses without an authenticated actor', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.listCatalogCourses(tenantId)).resolves.toEqual([
      {
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        catalogCategory: 'Writing',
        academicTerm: '2026 Fall',
        startsAt,
        endsAt,
      },
    ]);

    expect(coreMocks.listCatalogCoursesForTenant).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
    });
  });

  it('passes blueprint, catalog category, and academic term filters to core', async () => {
    const dependencies = createDependencies();

    await dependencies.listCatalogCourses(tenantId, {
      isBlueprint: true,
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
    });

    expect(coreMocks.listCatalogCoursesForTenant).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      isBlueprint: true,
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
    });
  });

  it('returns an empty list when no courses are catalog-visible', async () => {
    coreMocks.listCatalogCoursesForTenant.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(dependencies.listCatalogCourses(tenantId)).resolves.toEqual([]);
    expect(coreMocks.listCatalogCoursesForTenant).toHaveBeenCalledTimes(1);
  });
});
