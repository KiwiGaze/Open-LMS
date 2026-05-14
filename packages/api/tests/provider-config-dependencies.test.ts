import { Buffer } from 'node:buffer';
import type { TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getProviderConfigByTenantId: vi.fn(),
  upsertProviderConfig: vi.fn(),
  deleteProviderConfigByTenantId: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getProviderConfigByTenantId: coreMocks.getProviderConfigByTenantId,
    upsertProviderConfig: coreMocks.upsertProviderConfig,
    deleteProviderConfigByTenantId: coreMocks.deleteProviderConfigByTenantId,
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

const sampleUpsertInput = () => ({
  providerType: 'openai' as const,
  baseUrl: null,
  apiKey: 'sk-plain-test-key',
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
});

const createDependenciesWithKey = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
    ENCRYPTION_KEY_BASE64: Buffer.alloc(32, 1).toString('base64'),
  });

describe('provider config upsert API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.upsertProviderConfig.mockResolvedValue(sampleConfig());
  });

  it('encrypts the API key and returns the redacted summary for institution admins', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependenciesWithKey();

    const summary = await dependencies.upsertProviderConfig(
      actorUserId,
      tenantId,
      sampleUpsertInput(),
    );

    expect(coreMocks.upsertProviderConfig).toHaveBeenCalledTimes(1);
    const passedInput = coreMocks.upsertProviderConfig.mock.calls[0]?.[1];
    expect(passedInput.encryptedApiKey).not.toEqual('sk-plain-test-key');
    expect(JSON.parse(passedInput.encryptedApiKey)).toMatchObject({
      ciphertextBase64: expect.any(String),
      ivBase64: expect.any(String),
      authTagBase64: expect.any(String),
    });
    expect(summary).not.toHaveProperty('encryptedApiKey');
    expect(summary.providerType).toEqual('openai');
  });

  it('keeps the existing encrypted key when apiKey is omitted', async () => {
    setActorRole('institution_admin');
    coreMocks.getProviderConfigByTenantId.mockResolvedValue(sampleConfig());
    const dependencies = createDependenciesWithKey();

    const { apiKey: _omit, ...input } = sampleUpsertInput();
    await dependencies.upsertProviderConfig(actorUserId, tenantId, input);

    const passedInput = coreMocks.upsertProviderConfig.mock.calls[0]?.[1];
    expect(passedInput.encryptedApiKey).toEqual(sampleConfig().encryptedApiKey);
  });

  it('rejects creating a new config without an API key', async () => {
    setActorRole('institution_admin');
    coreMocks.getProviderConfigByTenantId.mockResolvedValue(null);
    const dependencies = createDependenciesWithKey();

    const { apiKey: _omit, ...input } = sampleUpsertInput();
    await expect(
      dependencies.upsertProviderConfig(actorUserId, tenantId, input),
    ).rejects.toMatchObject({ code: 'bad_request' });
    expect(coreMocks.upsertProviderConfig).not.toHaveBeenCalled();
  });

  it('fails with internal_error when ENCRYPTION_KEY_BASE64 is missing', async () => {
    setActorRole('institution_admin');
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertProviderConfig(actorUserId, tenantId, sampleUpsertInput()),
    ).rejects.toMatchObject({ code: 'internal_error' });
  });

  it('rejects non-admins with forbidden', async () => {
    setActorRole('instructor');
    const dependencies = createDependenciesWithKey();

    await expect(
      dependencies.upsertProviderConfig(actorUserId, tenantId, sampleUpsertInput()),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(coreMocks.upsertProviderConfig).not.toHaveBeenCalled();
  });
});

describe('provider config delete API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
  });

  it('deletes the config for institution admins', async () => {
    setActorRole('institution_admin');
    coreMocks.deleteProviderConfigByTenantId.mockResolvedValue(true);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteProviderConfig(actorUserId, tenantId),
    ).resolves.toBeUndefined();
    expect(coreMocks.deleteProviderConfigByTenantId).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
    );
  });

  it('returns not_found when no config exists', async () => {
    setActorRole('institution_admin');
    coreMocks.deleteProviderConfigByTenantId.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(dependencies.deleteProviderConfig(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('rejects non-admins with forbidden', async () => {
    setActorRole('instructor');
    const dependencies = createDependencies();

    await expect(dependencies.deleteProviderConfig(actorUserId, tenantId)).rejects.toMatchObject({
      code: 'forbidden',
    });
    expect(coreMocks.deleteProviderConfigByTenantId).not.toHaveBeenCalled();
  });
});
