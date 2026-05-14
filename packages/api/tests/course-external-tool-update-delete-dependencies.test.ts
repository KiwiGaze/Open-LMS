import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseExternalTool: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseExternalTool: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseExternalTool: coreMocks.deleteCourseExternalTool,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseExternalTool: coreMocks.updateCourseExternalTool,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const toolId = '01J9QW7B6N5W2YH3D3A1V0KE94';
const connectionId = '01J9QW7B6N5W2YH3D3A1V0KE95';
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

const sampleTool = () => ({
  id: toolId,
  tenantId,
  courseId,
  integrationConnectionId: connectionId,
  name: 'Mathway (renamed)',
  description: 'Updated description.',
  launchUrl: 'https://launch.example.test/mathway',
  placement: 'course_navigation',
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const duplicateNameError = (): unknown => ({
  code: '23505',
  constraint_name: 'course_external_tool_tenant_course_name_uq',
});

describe('course external tool update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseExternalTool.mockResolvedValue(sampleTool());
    coreMocks.deleteCourseExternalTool.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates an external tool for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseExternalTool(actorUserId, tenantId, courseId, toolId, {
        integrationConnectionId: connectionId,
        name: 'Mathway (renamed)',
        description: 'Updated description.',
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).resolves.toMatchObject({ id: toolId, name: 'Mathway (renamed)' });

    expect(coreMocks.updateCourseExternalTool).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      toolId,
      integrationConnectionId: connectionId,
      name: 'Mathway (renamed)',
      description: 'Updated description.',
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'course_navigation',
      status: 'active',
    });
  });

  it('returns not found when updating a missing external tool', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseExternalTool.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseExternalTool(actorUserId, tenantId, courseId, toolId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'External tool was not found in this course. Check the tool id and retry the request.',
    });
  });

  it('rejects students from updating external tools', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseExternalTool(actorUserId, tenantId, courseId, toolId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseExternalTool).not.toHaveBeenCalled();
  });

  it('maps duplicate names during update to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseExternalTool.mockRejectedValue(duplicateNameError());
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseExternalTool(actorUserId, tenantId, courseId, toolId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('deletes an external tool for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseExternalTool(actorUserId, tenantId, courseId, toolId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseExternalTool).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      toolId,
    });
  });

  it('returns not found when deleting a missing external tool', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseExternalTool.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseExternalTool(actorUserId, tenantId, courseId, toolId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'External tool was not found in this course. Check the tool id and retry the request.',
    });
  });

  it('rejects students from deleting external tools', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseExternalTool(actorUserId, tenantId, courseId, toolId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseExternalTool).not.toHaveBeenCalled();
  });
});
