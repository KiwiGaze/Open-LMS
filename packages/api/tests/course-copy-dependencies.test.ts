import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  copyCourseTemplate: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    copyCourseTemplate: coreMocks.copyCourseTemplate,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const sourceCourseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const targetCourseId = '01J9QW7B6N5W2YH3D3A1V0KE87';

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantAccess = (role: TenantRole): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role }]);
};

describe('course copy API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.copyCourseTemplate.mockResolvedValue({
      learningObjectivesCopied: 5,
      modulesCopied: 3,
      unitsCopied: 7,
      pagesCopied: 2,
      resourcesCopied: 9,
      wikiPagesCopied: 4,
      glossaryEntriesCopied: 6,
    });
    configureTenantAccess('student');
  });

  it('copies a course for tenant staff', async () => {
    configureTenantAccess('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.copyCourse(actorUserId, tenantId, sourceCourseId, { targetCourseId }),
    ).resolves.toEqual({
      learningObjectivesCopied: 5,
      modulesCopied: 3,
      unitsCopied: 7,
      pagesCopied: 2,
      resourcesCopied: 9,
      wikiPagesCopied: 4,
      glossaryEntriesCopied: 6,
    });

    expect(coreMocks.copyCourseTemplate).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      sourceCourseId,
      targetCourseId,
    });
  });

  it('rejects students from copying courses', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.copyCourse(actorUserId, tenantId, sourceCourseId, { targetCourseId }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.copyCourseTemplate).not.toHaveBeenCalled();
  });

  it('maps same-course copy errors to bad_request', async () => {
    configureTenantAccess('institution_admin');
    const { CourseCopySameCourseError } = await import('@openlms/core');
    coreMocks.copyCourseTemplate.mockRejectedValue(
      new CourseCopySameCourseError('Course copy source and target must be different courses.'),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.copyCourse(actorUserId, tenantId, sourceCourseId, {
        targetCourseId: sourceCourseId,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course copy source and target must be different courses.',
    });
  });
});
