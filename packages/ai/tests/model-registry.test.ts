import { ProviderConfig } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  defaultModelRegistry,
  estimateModelCostCents,
  resolveConfiguredModel,
} from '../src/model-registry.ts';

const encryptedApiKey = JSON.stringify({
  ciphertextBase64: 'Y2lwaGVydGV4dA==',
  ivBase64: 'MTIzNDU2Nzg5MDEy',
  authTagBase64: 'MTIzNDU2Nzg5MDEyMzQ1Ng==',
});

const providerConfig = ProviderConfig.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  providerType: 'openai_compatible',
  baseUrl: 'https://models.example.test/v1',
  encryptedApiKey,
  modelPreferences: {
    feedbackDraftModel: 'gpt-4.1-mini',
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

describe('AI model registry', () => {
  it('contains approved model profiles for every MVP action', () => {
    const supportedActions = [
      ...new Set(defaultModelRegistry.flatMap((profile) => profile.supportedActionIdentifiers)),
    ];

    expect(supportedActions).toEqual(
      expect.arrayContaining([
        'submission_precheck',
        'feedback_draft',
        'assignment_trend_card',
        'rubric_clarity_review',
        'page_explanation',
      ]),
    );
  });

  it('resolves configured model preferences through approved model metadata', () => {
    const model = resolveConfiguredModel('feedback_draft', providerConfig);

    expect(model.name).toBe('gpt-4.1-mini');
    expect(model.profile?.supportedActionIdentifiers).toContain('feedback_draft');
  });

  it('estimates model cost from input and output token usage', () => {
    const model = resolveConfiguredModel('feedback_draft', providerConfig);
    const estimatedCostCents = estimateModelCostCents(model.profile, {
      inputTokens: 1000,
      outputTokens: 500,
    });

    expect(estimatedCostCents).toBeGreaterThan(0);
  });
});
