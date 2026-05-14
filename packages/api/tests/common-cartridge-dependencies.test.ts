import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  exportCourseBackup: vi.fn(),
  exportCourseBackupAsCommonCartridge: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  parseCommonCartridgeCoursePackage: vi.fn(),
  restoreCourseBackup: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    exportCourseBackup: coreMocks.exportCourseBackup,
    exportCourseBackupAsCommonCartridge: coreMocks.exportCourseBackupAsCommonCartridge,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    parseCommonCartridgeCoursePackage: coreMocks.parseCommonCartridgeCoursePackage,
    restoreCourseBackup: coreMocks.restoreCourseBackup,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
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

const sampleBackup = () => ({
  formatVersion: '1',
  exportedAt: now,
  course: {
    id: courseId,
    tenantId,
    code: 'WRIT-101',
    title: 'Evidence-Based Writing',
    status: 'active',
    startsAt: null,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
  },
  learningObjectives: [],
  modules: [],
  units: [],
  pages: [],
  resources: [],
});

const sampleCartridge = () => ({
  format: 'imscc_1_3' as const,
  exportedAt: now,
  manifestXml: '<manifest identifier="openlms-course"></manifest>',
  files: [],
});

describe('Common Cartridge API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.exportCourseBackup.mockResolvedValue(sampleBackup());
    coreMocks.exportCourseBackupAsCommonCartridge.mockReturnValue(sampleCartridge());
    coreMocks.parseCommonCartridgeCoursePackage.mockReturnValue(sampleBackup());
    coreMocks.restoreCourseBackup.mockResolvedValue({
      learningObjectivesRestored: 0,
      modulesRestored: 0,
      unitsRestored: 0,
      pagesRestored: 0,
      resourcesRestored: 0,
    });
    configureCourseAccess('student', 'student');
  });

  it('exports a Common Cartridge package for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const cartridge = await dependencies.exportCourseCommonCartridge(
      actorUserId,
      tenantId,
      courseId,
    );

    expect(cartridge.format).toBe('imscc_1_3');
    expect(coreMocks.exportCourseBackup).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
    expect(coreMocks.exportCourseBackupAsCommonCartridge).toHaveBeenCalledWith(
      sampleBackup(),
      expect.any(Date),
    );
  });

  it('rejects students from exporting Common Cartridge packages', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.exportCourseCommonCartridge(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.exportCourseBackup).not.toHaveBeenCalled();
  });

  it('imports a Common Cartridge package for course staff through restore', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const result = await dependencies.importCourseCommonCartridge(
      actorUserId,
      tenantId,
      courseId,
      sampleCartridge(),
    );

    expect(coreMocks.parseCommonCartridgeCoursePackage).toHaveBeenCalledWith({
      package: sampleCartridge(),
      tenantId,
      courseId,
      now: expect.any(Date),
    });
    expect(coreMocks.restoreCourseBackup).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      targetCourseId: courseId,
      backup: sampleBackup(),
    });
    expect(result.format).toBe('imscc_1_3');
  });
});
