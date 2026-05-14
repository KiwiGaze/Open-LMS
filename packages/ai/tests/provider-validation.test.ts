import { ProviderConfig } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { aiActions } from '../src/actions.ts';
import type { ModelProvider } from '../src/gateway.ts';
import {
  providerValidationActionIdentifiers,
  validateProviderConfig,
} from '../src/provider-validation.ts';

const encryptedApiKey = JSON.stringify({
  ciphertextBase64: 'Y2lwaGVydGV4dA==',
  ivBase64: 'MTIzNDU2Nzg5MDEy',
  authTagBase64: 'MTIzNDU2Nzg5MDEyMzQ1Ng==',
});

const config = ProviderConfig.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  providerType: 'openai_compatible',
  baseUrl: 'https://models.example.test/v1',
  encryptedApiKey,
  modelPreferences: {
    pageExplanationModel: 'page-model',
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
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

describe('provider config validation probe', () => {
  it('uses the active AI action registry for compatibility preflight', () => {
    expect(providerValidationActionIdentifiers).toEqual(
      aiActions.map((action) => action.identifier),
    );
  });

  it('marks provider configs valid after a successful provider test call', async () => {
    let promptIdentifier = '';
    let actionIdentifier = '';
    let maxOutputTokens = 0;
    const provider: ModelProvider = {
      generateText: async (request) => {
        promptIdentifier = request.promptIdentifier;
        actionIdentifier = request.actionIdentifier;
        maxOutputTokens = request.maxOutputTokens;
        return {
          actionIdentifier: request.actionIdentifier,
          providerType: config.providerType,
          model: 'page-model',
          text: JSON.stringify({
            answer: 'Provider validation succeeded.',
            keyPoints: ['The provider returned parseable structured output.'],
            citedResourceIds: ['provider-config-validation'],
            followUpQuestions: ['What should I review next?'],
          }),
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };

    const result = await validateProviderConfig(provider, config);

    expect(result).toEqual({
      validationStatus: 'valid',
      validationError: null,
    });
    expect(actionIdentifier).toBe('page_explanation');
    expect(promptIdentifier).toBe('provider_config.validation');
    expect(maxOutputTokens).toBeGreaterThanOrEqual(128);
  });

  it('marks provider configs invalid when structured validation output is not JSON', async () => {
    const provider: ModelProvider = {
      generateText: async (request) => ({
        actionIdentifier: request.actionIdentifier,
        providerType: config.providerType,
        model: 'page-model',
        text: 'ok',
        usage: { inputTokens: 1, outputTokens: 1 },
        softQuotaExceeded: false,
      }),
    };

    const result = await validateProviderConfig(provider, config);

    expect(result.validationStatus).toBe('invalid');
    expect(result.validationError).toMatch(/structured output JSON/i);
  });

  it('returns an actionable invalid result when the provider test call fails', async () => {
    const provider: ModelProvider = {
      generateText: async () => {
        throw new Error('401 Unauthorized');
      },
    };

    const result = await validateProviderConfig(provider, config);

    expect(result.validationStatus).toBe('invalid');
    expect(result.validationError).toMatch(/401 Unauthorized/);
    expect(result.validationError).toMatch(/Check provider settings/);
  });

  it('marks provider configs invalid when the validation response is empty', async () => {
    const provider: ModelProvider = {
      generateText: async (request) => ({
        actionIdentifier: request.actionIdentifier,
        providerType: config.providerType,
        model: 'page-model',
        text: '',
        usage: { inputTokens: 1, outputTokens: 0 },
        softQuotaExceeded: false,
      }),
    };

    const result = await validateProviderConfig(provider, config);

    expect(result.validationStatus).toBe('invalid');
    expect(result.validationError).toMatch(/provider settings/i);
  });

  it('marks configs invalid when a registered model is incompatible with an action', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'page_explanation',
          providerType: 'local',
          model: 'local-llm',
          text: 'ok',
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };

    const result = await validateProviderConfig(
      provider,
      ProviderConfig.parse({
        ...config,
        providerType: 'local',
        baseUrl: null,
        modelPreferences: {
          feedbackDraftModel: 'local-llm',
          pageExplanationModel: 'local-llm',
        },
      }),
    );

    expect(result.validationStatus).toBe('invalid');
    expect(result.validationError).toMatch(/local-llm/);
    expect(result.validationError).toMatch(/feedback_draft/);
    expect(providerCalls).toBe(0);
  });

  it('marks configs invalid when structured output is unavailable for active actions', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'page_explanation',
          providerType: config.providerType,
          model: 'page-model',
          text: 'ok',
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };

    const result = await validateProviderConfig(
      provider,
      ProviderConfig.parse({
        ...config,
        capabilities: {
          ...config.capabilities,
          supportsStructuredOutput: false,
        },
      }),
    );

    expect(result.validationStatus).toBe('invalid');
    expect(result.validationError).toMatch(/structured output/i);
    expect(providerCalls).toBe(0);
  });
});
