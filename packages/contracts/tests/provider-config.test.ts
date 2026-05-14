import { describe, expect, it } from 'vitest';
import { ProviderConfig } from '../src/provider-config.ts';

const encryptedApiKey = JSON.stringify({
  ciphertextBase64: 'Y2lwaGVydGV4dA==',
  ivBase64: 'MTIzNDU2Nzg5MDEy',
  authTagBase64: 'MTIzNDU2Nzg5MDEyMzQ1Ng==',
});

describe('ProviderConfig', () => {
  it('parses tenant-scoped provider settings without exposing plaintext keys', () => {
    const now = new Date();
    const parsed = ProviderConfig.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      providerType: 'openai_compatible',
      baseUrl: 'https://models.example.test/v1',
      encryptedApiKey,
      modelPreferences: {
        precheckModel: 'gpt-4.1-mini',
        feedbackDraftModel: 'gpt-4.1',
        trendCardModel: 'gpt-4.1-mini',
        rubricClarityModel: 'gpt-4.1-mini',
        pageExplanationModel: 'gpt-4.1-mini',
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
        softWarnTokensPerPeriod: 100000,
        hardCapTokensPerPeriod: 200000,
        period: 'month',
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(parsed.encryptedApiKey).toBe(encryptedApiKey);
    expect(parsed.modelPreferences.pageExplanationModel).toBe('gpt-4.1-mini');
  });

  it('rejects provider URLs that could target internal services', () => {
    const now = new Date();
    const baseConfig = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      providerType: 'openai_compatible',
      encryptedApiKey,
      modelPreferences: {
        precheckModel: 'gpt-4.1-mini',
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
        softWarnTokensPerPeriod: 100000,
        hardCapTokensPerPeriod: 200000,
        period: 'month',
      },
      createdAt: now,
      updatedAt: now,
    };

    for (const baseUrl of [
      'http://models.example.test/v1',
      'https://localhost/v1',
      'https://127.0.0.1/v1',
      'https://10.0.0.4/v1',
      'https://172.16.0.4/v1',
      'https://192.168.1.4/v1',
      'https://169.254.169.254/latest',
      'https://[::1]/v1',
    ]) {
      expect(() => ProviderConfig.parse({ ...baseConfig, baseUrl })).toThrow(/provider base URL/i);
    }
  });

  it('rejects plaintext and malformed encrypted API keys', () => {
    const now = new Date();
    const baseConfig = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      providerType: 'openai_compatible',
      baseUrl: 'https://models.example.test/v1',
      modelPreferences: {
        precheckModel: 'gpt-4.1-mini',
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
        softWarnTokensPerPeriod: 100000,
        hardCapTokensPerPeriod: 200000,
        period: 'month',
      },
      createdAt: now,
      updatedAt: now,
    };

    for (const encryptedApiKey of [
      'ciphertext',
      JSON.stringify({ ciphertextBase64: 'Yw==', ivBase64: 'MTIz', authTagBase64: 'MTIz' }),
      JSON.stringify({ ciphertextBase64: 'Yw==', ivBase64: 'MTIzNDU2Nzg5MDEy' }),
    ]) {
      expect(() => ProviderConfig.parse({ ...baseConfig, encryptedApiKey })).toThrow(
        /encrypted API key/i,
      );
    }
  });

  it('requires timestamps for completed provider validation states', () => {
    const now = new Date();
    const baseConfig = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      providerType: 'openai_compatible',
      baseUrl: 'https://models.example.test/v1',
      encryptedApiKey,
      modelPreferences: {
        precheckModel: 'gpt-4.1-mini',
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
        softWarnTokensPerPeriod: 100000,
        hardCapTokensPerPeriod: 200000,
        period: 'month',
      },
      createdAt: now,
      updatedAt: now,
    };

    expect(() =>
      ProviderConfig.parse({
        ...baseConfig,
        validationStatus: 'invalid',
        validationError: '401 Unauthorized',
        validatedAt: null,
      }),
    ).toThrow(/timestamp/i);
  });

  it('rejects pending provider validation states with completed validation data', () => {
    const now = new Date();

    expect(() =>
      ProviderConfig.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        providerType: 'openai_compatible',
        baseUrl: 'https://models.example.test/v1',
        encryptedApiKey,
        modelPreferences: {
          precheckModel: 'gpt-4.1-mini',
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
          softWarnTokensPerPeriod: 100000,
          hardCapTokensPerPeriod: 200000,
          period: 'month',
        },
        validationStatus: 'pending',
        validationError: null,
        validatedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(/pending/i);
  });

  it('rejects provider quota soft warnings above the hard cap', () => {
    expect(() =>
      ProviderConfig.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        providerType: 'openai_compatible',
        baseUrl: 'https://models.example.test/v1',
        encryptedApiKey,
        modelPreferences: {
          precheckModel: 'gpt-4.1-mini',
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
          softWarnTokensPerPeriod: 250000,
          hardCapTokensPerPeriod: 200000,
          period: 'month',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(/soft warning/i);
  });

  it('requires at least one configured model preference', () => {
    expect(() =>
      ProviderConfig.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        providerType: 'openai_compatible',
        baseUrl: 'https://models.example.test/v1',
        encryptedApiKey,
        modelPreferences: {},
        capabilities: {
          supportsStructuredOutput: true,
          supportsTools: false,
          supportsVision: false,
          supportsPromptCaching: false,
          maxContextTokens: 128000,
          supportsDeterministic: true,
        },
        quota: {
          softWarnTokensPerPeriod: 100000,
          hardCapTokensPerPeriod: 200000,
          period: 'month',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(/model preference/i);
  });
});
