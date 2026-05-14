import { ProviderConfig, type ProviderConfig as ProviderConfigContract } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  recordProviderConfigValidationResult,
  upsertProviderConfig,
} from '../src/provider-configs/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const encryptedApiKey = JSON.stringify({
  ciphertextBase64: 'Y2lwaGVydGV4dA==',
  ivBase64: 'MTIzNDU2Nzg5MDEy',
  authTagBase64: 'MTIzNDU2Nzg5MDEyMzQ1Ng==',
});

const providerConfig = ProviderConfig.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  tenantId,
  providerType: 'openai_compatible',
  baseUrl: 'https://models.example.test/v1',
  encryptedApiKey,
  modelPreferences: {
    feedbackDraftModel: 'feedback-model',
  },
  capabilities: {
    supportsStructuredOutput: true,
    supportsTools: false,
    supportsVision: false,
    supportsPromptCaching: false,
    maxContextTokens: 128000,
    supportsDeterministic: true,
  },
  quota: {
    softWarnTokensPerPeriod: 100,
    hardCapTokensPerPeriod: 200,
    period: 'month',
  },
  validationStatus: 'pending',
  validationError: null,
  validatedAt: null,
  createdAt: now,
  updatedAt: now,
});

const createInsertOnlyDb = <T>(row: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [row],
        }),
      }),
    }),
  }) as unknown as Database;

const createTransitionDb = <T>(rows: T[]): Database =>
  ({
    update: () => ({
      set: (patch: Partial<T>) => ({
        where: () => ({
          returning: async () => {
            const [row] = rows;
            if (!row) {
              return [];
            }

            const updated = { ...row, ...patch };
            rows[0] = updated as T;
            return [updated];
          },
        }),
      }),
    }),
  }) as unknown as Database;

describe('provider config repository', () => {
  it('stores provider configs as pending validation until a test call succeeds', async () => {
    const saved = await upsertProviderConfig(createInsertOnlyDb(providerConfig), {
      tenantId,
      providerType: 'openai_compatible',
      baseUrl: 'https://models.example.test/v1',
      encryptedApiKey,
      modelPreferences: providerConfig.modelPreferences,
      capabilities: providerConfig.capabilities,
      quota: providerConfig.quota,
    });

    expect(saved.validationStatus).toBe('pending');
    expect(saved.validatedAt).toBeNull();
  });

  it('records provider validation results for the gateway guard', async () => {
    const rows: ProviderConfigContract[] = [providerConfig];

    const validated = await recordProviderConfigValidationResult(
      createTransitionDb(rows),
      {
        tenantId,
        validationStatus: 'valid',
        validationError: null,
      },
      now,
    );

    expect(validated.validationStatus).toBe('valid');
    expect(validated.validationError).toBeNull();
    expect(validated.validatedAt).toEqual(now);
  });
});
