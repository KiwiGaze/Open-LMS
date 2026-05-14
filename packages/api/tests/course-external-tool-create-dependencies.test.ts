import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseExternalTool: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseExternalTool: coreMocks.createCourseExternalTool,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const connectionId = '01J9QW7B6N5W2YH3D3A1V0KE8G';
const toolId = '01J9QW7B6N5W2YH3D3A1V0KE8H';
const now = new Date('2026-05-10T00:00:00.000Z');

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

const missingCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_external_tool_tenant_course_fk',
});

const missingConnectionError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_external_tool_tenant_connection_fk',
});

const duplicateNameError = (): unknown => ({
  code: '23505',
  constraint_name: 'course_external_tool_tenant_course_name_uq',
});

describe('course external tool creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseExternalTool.mockResolvedValue({
      id: toolId,
      tenantId,
      courseId,
      integrationConnectionId: connectionId,
      name: 'Mathway',
      description: 'Step-by-step math problem solver.',
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'course_navigation',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates external tools for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseExternalTool(actorUserId, tenantId, courseId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: 'Step-by-step math problem solver.',
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).resolves.toMatchObject({
      id: toolId,
      courseId,
      integrationConnectionId: connectionId,
      name: 'Mathway',
      placement: 'course_navigation',
      status: 'active',
    });

    expect(coreMocks.createCourseExternalTool).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      integrationConnectionId: connectionId,
      name: 'Mathway',
      description: 'Step-by-step math problem solver.',
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'course_navigation',
      status: 'active',
    });
  });

  it('allows tenant staff without course membership to create external tools', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseExternalTool(actorUserId, tenantId, courseId, {
      integrationConnectionId: connectionId,
      name: 'Mathway',
      description: null,
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'editor_button',
      status: 'active',
    });

    expect(coreMocks.createCourseExternalTool).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      integrationConnectionId: connectionId,
      name: 'Mathway',
      description: null,
      launchUrl: 'https://launch.example.test/mathway',
      placement: 'editor_button',
      status: 'active',
    });
  });

  it('rejects students creating external tools', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseExternalTool(actorUserId, tenantId, courseId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create external tools. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseExternalTool).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseExternalTool.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseExternalTool(actorUserId, tenantId, courseId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps missing integration connections to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseExternalTool.mockRejectedValue(missingConnectionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseExternalTool(actorUserId, tenantId, courseId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Integration connection was not found in this tenant. Check the connection id and retry the request.',
    });
  });

  it('maps duplicate names to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseExternalTool.mockRejectedValue(duplicateNameError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseExternalTool(actorUserId, tenantId, courseId, {
        integrationConnectionId: connectionId,
        name: 'Mathway',
        description: null,
        launchUrl: 'https://launch.example.test/mathway',
        placement: 'course_navigation',
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'External tool name already exists in this course. Choose a unique name and retry the request.',
    });
  });
});
