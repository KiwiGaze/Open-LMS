import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteRubric: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateRubric: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteRubric: coreMocks.deleteRubric,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateRubric: coreMocks.updateRubric,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const rubricId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const now = new Date('2026-05-12T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantAccess = (role: TenantRole): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role }]);
};

const sampleRubric = () => ({
  id: rubricId,
  tenantId,
  title: 'Argument writing rubric (updated)',
  version: 2,
  sourceTemplateId: null,
  criteria: [
    {
      id: 'evidence',
      label: 'Evidence',
      description: 'Refreshed evidence criterion.',
      evidenceRequired: true,
      levels: [
        {
          id: 'developing',
          label: 'Developing',
          description: 'Evidence is present but weakly explained.',
          points: 2,
        },
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  title: 'Argument writing rubric (updated)',
  sourceTemplateId: null,
  criteria: sampleRubric().criteria,
};

describe('rubric update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateRubric.mockResolvedValue(sampleRubric());
    coreMocks.deleteRubric.mockResolvedValue(true);
    configureTenantAccess('student');
  });

  it('updates a rubric for tenant staff', async () => {
    configureTenantAccess('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateRubric(actorUserId, tenantId, rubricId, updateInput),
    ).resolves.toMatchObject({ id: rubricId, version: 2 });

    expect(coreMocks.updateRubric).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      rubricId,
      title: updateInput.title,
      sourceTemplateId: updateInput.sourceTemplateId,
      criteria: updateInput.criteria,
    });
  });

  it('returns not found when updating a missing rubric', async () => {
    configureTenantAccess('institution_admin');
    coreMocks.updateRubric.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateRubric(actorUserId, tenantId, rubricId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Rubric was not found in this tenant. Check the rubric id and retry the request.',
    });
  });

  it('returns bad_request when update references missing template', async () => {
    configureTenantAccess('institution_admin');
    coreMocks.updateRubric.mockRejectedValue({
      code: '23503',
      constraint_name: 'rubric_source_template_id_rubric_template_id_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateRubric(actorUserId, tenantId, rubricId, updateInput),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('rejects students from updating rubrics', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateRubric(actorUserId, tenantId, rubricId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateRubric).not.toHaveBeenCalled();
  });

  it('deletes a rubric for tenant staff', async () => {
    configureTenantAccess('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteRubric(actorUserId, tenantId, rubricId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteRubric).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      rubricId,
    });
  });

  it('returns not found when deleting a missing rubric', async () => {
    configureTenantAccess('institution_admin');
    coreMocks.deleteRubric.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(dependencies.deleteRubric(actorUserId, tenantId, rubricId)).rejects.toMatchObject({
      code: 'not_found',
      message: 'Rubric was not found in this tenant. Check the rubric id and retry the request.',
    });
  });

  it('rejects students from deleting rubrics', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.deleteRubric(actorUserId, tenantId, rubricId)).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(coreMocks.deleteRubric).not.toHaveBeenCalled();
  });
});
