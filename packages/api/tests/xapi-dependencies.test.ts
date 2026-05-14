import { XapiStatement } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserTenantMemberships: vi.fn(),
  saveXapiStatement: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveXapiStatement: coreMocks.saveXapiStatement,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const statementRecordId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const statementId = '550e8400-e29b-41d4-a716-446655440000';
const now = new Date('2026-05-14T00:00:00.000Z');

const statementInput = {
  id: statementId,
  actor: { objectType: 'Agent', account: { homePage: 'https://lms.example.edu', name: 'user-1' } },
  verb: { id: 'https://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
  object: { id: 'https://lms.example.edu/activity/1', objectType: 'Activity' },
  result: { completion: true },
  context: { platform: 'Open-LMS' },
  timestamp: '2026-05-14T00:00:00.000Z',
};

const statement = () =>
  XapiStatement.parse({
    id: statementRecordId,
    tenantId,
    statementId,
    receivedById: actorUserId,
    actor: statementInput.actor,
    verb: statementInput.verb,
    object: statementInput.object,
    result: statementInput.result,
    context: statementInput.context,
    timestamp: now,
    storedAt: now,
    createdAt: now,
    updatedAt: now,
  });

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

describe('xAPI API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: 'student' }]);
    coreMocks.saveXapiStatement.mockResolvedValue(statement());
  });

  it('stores statements for authenticated tenant members', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.ingestXapiStatement(actorUserId, tenantId, statementInput),
    ).resolves.toMatchObject({ statementId });

    expect(coreMocks.saveXapiStatement).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        statementId,
        receivedById: actorUserId,
      }),
    );
  });

  it('rejects users outside the tenant', async () => {
    coreMocks.listUserTenantMemberships.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.ingestXapiStatement(actorUserId, tenantId, statementInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.saveXapiStatement).not.toHaveBeenCalled();
  });
});
