import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getProviderConfigByTenantId: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getProviderConfigByTenantId: coreMocks.getProviderConfigByTenantId,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEH0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEH1';
const configId = '01J9QW7B6N5W2YH3D3A1V0KEH2';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const setActorRole = (role: TenantRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue(role ? [{ tenantId, role }] : []);
};

const sampleConfig = () => ({
  id: configId,
  tenantId,
  providerType: 'openai',
  baseUrl: null,
  encryptedApiKey: 'AAAAAAAAAAAAAAAAAAAAAA==',
  modelPreferences: { feedbackDraftModel: 'gpt-4.1' },
  capabilities: {
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: false,
    supportsPromptCaching: false,
    maxContextTokens: 128000,
    supportsDeterministic: true,
  },
  quota: {
    softWarnTokensPerPeriod: 100000,
    hardCapTokensPerPeriod: 500000,
    period: 'month' as const,
  },
  validationStatus: 'pending' as const,
  validationError: null,
  validatedAt: null,
  createdAt: now,
  updatedAt: now,
});

describe('provider config get API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getProviderConfigByTenantId.mockResolvedValue(sampleConfig());
  });

  it('returns config for institution admins without the encrypted key', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    const summary = await dependencies.getProviderConfig(actorUserId, tenantId);

    expect(summary).toMatchObject({
      id: configId,
      providerType: 'openai',
      validationStatus: 'pending',
    });
    expect(summary).not.toHaveProperty('encryptedApiKey');
  });

  it('rejects instructors with forbidden', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(dependencies.getProviderConfig(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(coreMocks.getProviderConfigByTenantId).not.toHaveBeenCalled();
  });

  it('returns not_found when no config is configured', async () => {
    setActorRole('institution_admin');
    coreMocks.getProviderConfigByTenantId.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(dependencies.getProviderConfig(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('rejects non-tenant members with forbidden', async () => {
    setActorRole(null);
    const dependencies = createDependencies();

    await expect(dependencies.getProviderConfig(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
