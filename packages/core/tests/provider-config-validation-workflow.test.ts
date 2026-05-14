import { type AuditLog, type OutboxEvent, ProviderConfig } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { recordProviderConfigValidation } from '../src/provider-configs/validation-workflow.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const actorId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const encryptedApiKey = JSON.stringify({
  ciphertextBase64: 'Y2lwaGVydGV4dA==',
  ivBase64: 'MTIzNDU2Nzg5MDEy',
  authTagBase64: 'MTIzNDU2Nzg5MDEyMzQ1Ng==',
});

const providerConfig = ProviderConfig.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
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

describe('provider config validation workflow', () => {
  it('records validation status with audit and outbox evidence', async () => {
    const audits: AuditLog[] = [];
    const events: OutboxEvent[] = [];
    let validationInput: unknown = null;

    const result = await recordProviderConfigValidation(
      {
        tenantId,
        actorId,
        validationStatus: 'invalid',
        validationError: '401 Unauthorized',
        now,
      },
      {
        recordValidationResult: async (input) => {
          validationInput = input;

          return ProviderConfig.parse({
            ...providerConfig,
            validationStatus: 'invalid',
            validationError: '401 Unauthorized',
            validatedAt: now,
            updatedAt: now,
          });
        },
        saveAuditLog: async (auditLog) => {
          audits.push(auditLog);
        },
        saveOutboxEvent: async (event) => {
          events.push(event);
        },
      },
    );

    expect(result.providerConfig.validationStatus).toBe('invalid');
    expect(validationInput).toEqual({
      tenantId,
      validationStatus: 'invalid',
      validationError: '401 Unauthorized',
      validatedAt: now,
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]?.action).toBe('validate_provider_config');
    expect(audits[0]?.resourceId).toBe(providerConfig.id);
    expect(audits[0]?.metadata).toEqual({
      providerType: 'openai_compatible',
      validationStatus: 'invalid',
      validationError: '401 Unauthorized',
    });
    expect(JSON.stringify(audits[0])).not.toContain('ciphertext');
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('ai.provider_config.validation_recorded');
    expect(events[0]?.payload).toEqual({
      providerConfigId: providerConfig.id,
      providerType: 'openai_compatible',
      validationStatus: 'invalid',
      validationError: '401 Unauthorized',
    });
  });

  it('rejects validation records returned for a different tenant', async () => {
    let auditSaved = false;
    let eventSaved = false;

    await expect(
      recordProviderConfigValidation(
        {
          tenantId,
          actorId,
          validationStatus: 'valid',
          validationError: null,
          now,
        },
        {
          recordValidationResult: async () =>
            ProviderConfig.parse({
              ...providerConfig,
              tenantId: '01J9QW7B6N5W2YH3D3A1V0KE31',
              validationStatus: 'valid',
              validatedAt: now,
              updatedAt: now,
            }),
          saveAuditLog: async () => {
            auditSaved = true;
          },
          saveOutboxEvent: async () => {
            eventSaved = true;
          },
        },
      ),
    ).rejects.toThrow(/tenant/i);
    expect(auditSaved).toBe(false);
    expect(eventSaved).toBe(false);
  });
});
