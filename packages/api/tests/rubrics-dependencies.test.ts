import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createRubric: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createRubric: coreMocks.createRubric,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const rubricId = '01J9QW7B6N5W2YH3D3A1V0KE3C';
const sourceTemplateId = '01J9QW7B6N5W2YH3D3A1V0KE8D';
const now = new Date('2026-05-10T00:00:00.000Z');

const sampleCriteria = [
  {
    id: 'evidence-reasoning',
    label: 'Evidence and reasoning',
    description: 'Selects relevant evidence and connects it to the claim with reasoning.',
    evidenceRequired: true,
    levels: [
      {
        id: 'proficient',
        label: 'Proficient',
        description: 'Evidence is relevant and reasoning connects it to the claim.',
        points: 4,
      },
      {
        id: 'developing',
        label: 'Developing',
        description: 'Evidence is relevant but reasoning is incomplete.',
        points: 2,
      },
    ],
  },
];

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureTenantMembership = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role === null ? [] : [{ tenantId, role }]);
};

const missingRubricTemplateError = (): unknown => ({
  code: '23503',
  constraint_name: 'rubric_source_template_id_rubric_template_id_fk',
});

describe('rubric creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createRubric.mockResolvedValue({
      id: rubricId,
      tenantId,
      title: 'Argument writing rubric',
      version: 1,
      sourceTemplateId,
      criteria: sampleCriteria,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('creates rubrics for tenant staff (instructor)', async () => {
    configureTenantMembership('instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createRubric(actorUserId, tenantId, {
        title: 'Argument writing rubric',
        sourceTemplateId,
        criteria: sampleCriteria,
      }),
    ).resolves.toMatchObject({
      id: rubricId,
      title: 'Argument writing rubric',
      version: 1,
      sourceTemplateId,
    });

    expect(coreMocks.createRubric).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      title: 'Argument writing rubric',
      sourceTemplateId,
      criteria: sampleCriteria,
    });
  });

  it('rejects students creating rubrics', async () => {
    configureTenantMembership('student');
    const dependencies = createDependencies();

    await expect(
      dependencies.createRubric(actorUserId, tenantId, {
        title: 'Argument writing rubric',
        sourceTemplateId: null,
        criteria: sampleCriteria,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only tenant staff can create rubrics. Ask an institution administrator for access.',
    });

    expect(coreMocks.createRubric).not.toHaveBeenCalled();
  });

  it('rejects non-tenant-members creating rubrics', async () => {
    configureTenantMembership(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createRubric(actorUserId, tenantId, {
        title: 'Argument writing rubric',
        sourceTemplateId: null,
        criteria: sampleCriteria,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only tenant staff can create rubrics. Ask an institution administrator for access.',
    });

    expect(coreMocks.createRubric).not.toHaveBeenCalled();
  });

  it('maps missing source templates to a bad request', async () => {
    configureTenantMembership('institution_admin');
    coreMocks.createRubric.mockRejectedValue(missingRubricTemplateError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createRubric(actorUserId, tenantId, {
        title: 'Argument writing rubric',
        sourceTemplateId,
        criteria: sampleCriteria,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Rubric template was not found. Check the source template id and retry the request.',
    });
  });
});
