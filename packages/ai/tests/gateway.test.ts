import { ProviderConfig } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { type GatewayRequest, type ModelProvider, createAiGateway } from '../src/gateway.ts';

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
    precheckModel: 'precheck-model',
    feedbackDraftModel: 'feedback-model',
    trendCardModel: 'trend-model',
    rubricClarityModel: 'rubric-model',
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
  validationStatus: 'valid',
  validationError: null,
  validatedAt: new Date('2026-05-10T00:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const request: GatewayRequest = {
  actionIdentifier: 'feedback_draft',
  tenantId: providerConfig.tenantId,
  actorId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  messages: [{ role: 'user', content: 'Draft feedback for this submission.' }],
  maxOutputTokens: 50,
};

const feedbackDraftText = JSON.stringify({
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Use specific evidence to support the claim.',
      teacherNote: null,
      evidence: ['The submission references one quote.'],
      suggestedLevelId: null,
      suggestedScore: null,
    },
  ],
  overallComment: 'Good start; add clearer evidence analysis.',
});

const structuredTextByAction: Record<string, string> = {
  submission_precheck: JSON.stringify({
    summary: 'Ready to submit after one evidence revision.',
    issues: [
      {
        criterionId: 'criterion-evidence',
        severity: 'medium',
        message: 'Evidence needs a clearer explanation.',
        evidence: ['The quote is included without analysis.'],
        suggestion: 'Explain how the quote proves the topic sentence.',
      },
    ],
  }),
  feedback_draft: feedbackDraftText,
  assignment_trend_card: JSON.stringify({
    title: 'Evidence explanation gap',
    summary: 'Several submissions cite evidence without explaining it.',
    trendType: 'criterion_weakness',
    cohortSizeTotal: 4,
    cohortSizeConsenting: 4,
    signalQualityClass: 'representative',
    evidence: ['Three drafts include unexplained quotes.'],
    suggestedTeachingAction: 'Model one annotated paragraph in class.',
  }),
  rubric_clarity_review: JSON.stringify({
    qualityScore: 0.82,
    summary: 'The rubric is mostly clear.',
    issues: [],
  }),
  page_explanation: JSON.stringify({
    answer: 'Evidence supports a claim when it is connected to the reason.',
    keyPoints: ['Choose relevant evidence.', 'Explain the connection.'],
    citedResourceIds: ['page-1'],
    followUpQuestions: ['What evidence best supports your reason?'],
  }),
};

describe('AI gateway', () => {
  it('routes registered AI actions through the configured provider', async () => {
    const usageRecords: unknown[] = [];
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier: 'feedback_draft',
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: feedbackDraftText,
        usage: { inputTokens: 10, outputTokens: 15 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(
      provider,
      {
        getUsedTokens: async () => 20,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
    );

    const response = await gateway.generate(request, providerConfig);

    expect(response.model).toBe('feedback-model');
    expect(response.softQuotaExceeded).toBe(false);
    expect(response.text).toBe(feedbackDraftText);
    expect(usageRecords).toEqual([
      expect.objectContaining({
        promptIdentifier: 'feedback_draft.default',
        promptVersion: '2026-05-10.1',
      }),
    ]);
  });

  it('records estimated model cost when the selected model has a registry profile', async () => {
    const usageRecords: unknown[] = [];
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier: 'feedback_draft',
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: feedbackDraftText,
        usage: { inputTokens: 1000, outputTokens: 500 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(
      provider,
      {
        getUsedTokens: async () => 20,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
    );

    await gateway.generate(
      request,
      ProviderConfig.parse({
        ...providerConfig,
        modelPreferences: {
          feedbackDraftModel: 'gpt-4.1-mini',
        },
        quota: {
          ...providerConfig.quota,
          hardCapTokensPerPeriod: 10_000,
        },
      }),
    );

    expect(usageRecords).toEqual([
      expect.objectContaining({
        model: 'gpt-4.1-mini',
        estimatedCostCents: expect.any(Number),
      }),
    ]);
  });

  it('rejects empty provider responses without recording generation usage', async () => {
    const usageRecords: unknown[] = [];
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier: 'feedback_draft',
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: '',
        usage: { inputTokens: 10, outputTokens: 0 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(
      provider,
      {
        getUsedTokens: async () => 20,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
    );

    await expect(gateway.generate(request, providerConfig)).rejects.toThrow();
    expect(usageRecords).toEqual([]);
  });

  it('blocks registered models that do not support the requested action and provider', async () => {
    let providerCalls = 0;
    let usageReads = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'local',
          model: 'local-llm',
          text: feedbackDraftText,
          usage: { inputTokens: 10, outputTokens: 15 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => {
        usageReads += 1;
        return 20;
      },
    });

    await expect(
      gateway.generate(
        request,
        ProviderConfig.parse({
          ...providerConfig,
          providerType: 'local',
          baseUrl: null,
          modelPreferences: {
            feedbackDraftModel: 'local-llm',
          },
        }),
      ),
    ).rejects.toThrow(/does not support action "feedback_draft"/i);
    expect(providerCalls).toBe(0);
    expect(usageReads).toBe(0);
  });

  it('blocks structured-output actions when provider capabilities do not support them', async () => {
    let providerCalls = 0;
    let usageReads = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 10, outputTokens: 15 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => {
        usageReads += 1;
        return 20;
      },
    });

    await expect(
      gateway.generate(
        request,
        ProviderConfig.parse({
          ...providerConfig,
          capabilities: {
            ...providerConfig.capabilities,
            supportsStructuredOutput: false,
          },
        }),
      ),
    ).rejects.toThrow(/structured output/i);
    expect(providerCalls).toBe(0);
    expect(usageReads).toBe(0);
  });

  it('marks responses when soft quota is exceeded after generation', async () => {
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier: 'feedback_draft',
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: feedbackDraftText,
        usage: { inputTokens: 10, outputTokens: 15 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 90,
    });

    const response = await gateway.generate(request, providerConfig);

    expect(response.softQuotaExceeded).toBe(true);
  });

  it('retries transient provider failures before succeeding', async () => {
    let attempts = 0;
    const usageRecords: unknown[] = [];
    const provider: ModelProvider = {
      generateText: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('Provider timeout');
        }

        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 10, outputTokens: 15 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(
      provider,
      {
        getUsedTokens: async () => 20,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
      { maxRetries: 1 },
    );

    const response = await gateway.generate(request, providerConfig);

    expect(response.text).toBe(feedbackDraftText);
    expect(attempts).toBe(2);
    expect(usageRecords).toEqual([expect.objectContaining({ retryCount: 1 })]);
  });

  it('uses a fallback provider after primary retries are exhausted', async () => {
    const usageRecords: unknown[] = [];
    let fallbackBaseUrl: string | null = null;
    const primaryProvider: ModelProvider = {
      generateText: async () => {
        throw new Error('Primary provider unavailable');
      },
    };
    const fallbackProvider: ModelProvider = {
      generateText: async (_request, config) => {
        fallbackBaseUrl = config.baseUrl;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'fallback-feedback-model',
          text: feedbackDraftText,
          usage: { inputTokens: 8, outputTokens: 13 },
          softQuotaExceeded: false,
        };
      },
    };
    const fallbackProviderConfig = ProviderConfig.parse({
      ...providerConfig,
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      baseUrl: 'https://fallback-models.example.test/v1',
      modelPreferences: {
        feedbackDraftModel: 'fallback-feedback-model',
      },
    });
    const gateway = createAiGateway(
      primaryProvider,
      {
        getUsedTokens: async () => 20,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
      { maxRetries: 0, fallbackProvider, fallbackProviderConfig },
    );

    const response = await gateway.generate(request, providerConfig);

    expect(response.text).toBe(feedbackDraftText);
    expect(response.providerType).toBe('openai_compatible');
    expect(response.model).toBe('fallback-feedback-model');
    expect(fallbackBaseUrl).toBe('https://fallback-models.example.test/v1');
    expect(usageRecords).toEqual([
      expect.objectContaining({
        providerType: 'openai_compatible',
        model: 'fallback-feedback-model',
        fallbackUsed: true,
        retryCount: 1,
        estimatedCostCents: null,
      }),
    ]);
  });

  it('redacts sensitive identifiers before sending messages to the provider', async () => {
    let providerContent = '';
    const provider: ModelProvider = {
      generateText: async (providerRequest) => {
        providerContent = providerRequest.messages[0]?.content ?? '';
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 10, outputTokens: 15 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 20,
    });

    await gateway.generate(
      {
        ...request,
        messages: [
          {
            role: 'user',
            content: 'Draft feedback for learner@example.edu at 555-123-4567.',
          },
        ],
      },
      providerConfig,
    );

    expect(providerContent).toContain('[redacted-email]');
    expect(providerContent).toContain('[redacted-phone]');
    expect(providerContent).not.toContain('learner@example.edu');
  });

  it.each([
    ['submission_precheck', 'precheck-model'],
    ['feedback_draft', 'feedback-model'],
    ['assignment_trend_card', 'trend-model'],
    ['rubric_clarity_review', 'rubric-model'],
    ['page_explanation', 'page-model'],
  ])('selects the configured model for %s', async (actionIdentifier, expectedModel) => {
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier,
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: structuredTextByAction[actionIdentifier] ?? feedbackDraftText,
        usage: { inputTokens: 10, outputTokens: 15 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 20,
    });

    const response = await gateway.generate({ ...request, actionIdentifier }, providerConfig);

    expect(response.model).toBe(expectedModel);
  });

  it('rejects schema-invalid structured output before recording usage', async () => {
    const usageRecords: unknown[] = [];
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier: 'feedback_draft',
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: JSON.stringify({ overallComment: 'Missing criterion feedback.' }),
        usage: { inputTokens: 10, outputTokens: 15 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(
      provider,
      {
        getUsedTokens: async () => 20,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
    );

    await expect(gateway.generate(request, providerConfig)).rejects.toThrow();
    expect(usageRecords).toEqual([]);
  });

  it('blocks requests after the hard quota is exhausted', async () => {
    const provider: ModelProvider = {
      generateText: async () => {
        throw new Error('Provider should not be called after hard quota exhaustion.');
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 200,
    });

    await expect(gateway.generate(request, providerConfig)).rejects.toThrow(/quota is exhausted/);
  });

  it('blocks requests until the provider config has validated', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 20,
    });
    const pendingConfig = ProviderConfig.parse({
      ...providerConfig,
      validationStatus: 'pending',
      validatedAt: null,
      validationError: null,
    });

    await expect(gateway.generate(request, pendingConfig)).rejects.toThrow(
      /provider config has not validated/i,
    );
    expect(providerCalls).toBe(0);
  });

  it('blocks requests when provider config validation failed', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 20,
    });
    const invalidConfig = ProviderConfig.parse({
      ...providerConfig,
      validationStatus: 'invalid',
      validatedAt: new Date('2026-05-10T00:00:00.000Z'),
      validationError: '401 Unauthorized',
    });

    await expect(gateway.generate(request, invalidConfig)).rejects.toThrow(
      /validation failed: 401 Unauthorized/i,
    );
    expect(providerCalls).toBe(0);
  });

  it('blocks requests that would exceed the hard quota reservation', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 175,
    });

    await expect(gateway.generate(request, providerConfig)).rejects.toThrow(/quota is exhausted/);
    expect(providerCalls).toBe(0);
  });

  it('blocks requests whose estimated prompt plus output reservation exceed the hard quota', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 100,
    });
    const longPrompt = Array.from({ length: 90 }, () => 'evidence').join(' ');

    await expect(
      gateway.generate(
        {
          ...request,
          messages: [{ role: 'user', content: longPrompt }],
          maxOutputTokens: 15,
        },
        providerConfig,
      ),
    ).rejects.toThrow(/quota is exhausted/);
    expect(providerCalls).toBe(0);
  });

  it('records usage and blocks responses whose actual usage exceeds the hard quota', async () => {
    const usageRecords: unknown[] = [];
    const provider: ModelProvider = {
      generateText: async () => ({
        actionIdentifier: 'feedback_draft',
        providerType: 'openai_compatible',
        model: 'raw-provider-model',
        text: feedbackDraftText,
        usage: { inputTokens: 30, outputTokens: 60 },
        softQuotaExceeded: false,
      }),
    };
    const gateway = createAiGateway(
      provider,
      {
        getUsedTokens: async () => 120,
      },
      {
        recordGeneration: async (record) => {
          usageRecords.push(record);
        },
      },
    );

    await expect(gateway.generate(request, providerConfig)).rejects.toThrow(/quota is exhausted/i);
    expect(usageRecords).toEqual([
      expect.objectContaining({
        inputTokens: 30,
        outputTokens: 60,
      }),
    ]);
  });

  it('blocks requests that exceed the provider context capacity', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 20,
    });

    await expect(
      gateway.generate(
        {
          ...request,
          maxOutputTokens: 9000,
        },
        ProviderConfig.parse({
          ...providerConfig,
          capabilities: {
            ...providerConfig.capabilities,
            maxContextTokens: 8192,
          },
          quota: {
            ...providerConfig.quota,
            softWarnTokensPerPeriod: 9500,
            hardCapTokensPerPeriod: 10000,
          },
        }),
      ),
    ).rejects.toThrow(/context capacity/i);
    expect(providerCalls).toBe(0);
  });

  it('blocks requests whose prompt plus output reservation exceed context capacity', async () => {
    let providerCalls = 0;
    const provider: ModelProvider = {
      generateText: async () => {
        providerCalls += 1;
        return {
          actionIdentifier: 'feedback_draft',
          providerType: 'openai_compatible',
          model: 'raw-provider-model',
          text: feedbackDraftText,
          usage: { inputTokens: 1, outputTokens: 1 },
          softQuotaExceeded: false,
        };
      },
    };
    const gateway = createAiGateway(provider, {
      getUsedTokens: async () => 20,
    });
    const longPrompt = Array.from({ length: 90 }, () => 'evidence').join(' ');

    await expect(
      gateway.generate(
        {
          ...request,
          messages: [{ role: 'user', content: longPrompt }],
          maxOutputTokens: 15,
        },
        ProviderConfig.parse({
          ...providerConfig,
          capabilities: {
            ...providerConfig.capabilities,
            maxContextTokens: 100,
          },
        }),
      ),
    ).rejects.toThrow(/context capacity/i);
    expect(providerCalls).toBe(0);
  });
});
