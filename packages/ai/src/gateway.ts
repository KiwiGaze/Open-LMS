import { ProviderConfig, type ProviderConfig as ProviderConfigContract } from '@openlms/contracts';
import { z } from 'zod';
import { getAiAction } from './actions.ts';
import { checkPromptInjection, redactSensitiveGatewayMessages } from './guardrails.ts';
import {
  estimateModelCostCents,
  findModelProfile,
  isRegisteredModelName,
  resolveConfiguredModel,
} from './model-registry.ts';
import { parseStructuredAiOutput } from './structured-output.ts';
import { countApproximateTokens } from './token-estimation.ts';

export const GatewayMessage = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});
export type GatewayMessage = z.infer<typeof GatewayMessage>;

export const GatewayRequest = z.object({
  actionIdentifier: z.string().min(1),
  tenantId: z.string().min(1),
  actorId: z.string().min(1).nullable(),
  contextPackageId: z.string().min(1),
  promptIdentifier: z.string().min(1),
  promptVersion: z.string().min(1),
  messages: z.array(GatewayMessage).min(1),
  maxOutputTokens: z.number().int().positive().max(32768),
});
export type GatewayRequest = z.infer<typeof GatewayRequest>;

export const GatewayUsage = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});
export type GatewayUsage = z.infer<typeof GatewayUsage>;

export const GatewayResponse = z.object({
  actionIdentifier: z.string().min(1),
  providerType: z.string().min(1),
  model: z.string().min(1),
  text: z.string().min(1),
  usage: GatewayUsage,
  softQuotaExceeded: z.boolean(),
});
export type GatewayResponse = z.infer<typeof GatewayResponse>;

export type ModelProvider = {
  generateText: (
    request: GatewayRequest,
    config: ProviderConfigContract,
  ) => Promise<GatewayResponse>;
};

export type TokenUsageReader = {
  getUsedTokens: (
    tenantId: string,
    period: ProviderConfigContract['quota']['period'],
  ) => Promise<number>;
};

export type GatewayUsageRecord = {
  tenantId: string;
  actorId: string | null;
  actionIdentifier: string;
  contextPackageId: string;
  promptIdentifier: string;
  promptVersion: string;
  providerType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  retryCount: number;
  fallbackUsed: boolean;
  estimatedCostCents: number | null;
};

export type GatewayUsageRecorder = {
  recordGeneration: (record: GatewayUsageRecord) => Promise<void>;
};

export type AiGateway = {
  generate: (request: GatewayRequest, config: ProviderConfigContract) => Promise<GatewayResponse>;
};

export type AiGatewayOptions = {
  maxRetries?: number;
  fallbackProvider?: ModelProvider;
  fallbackProviderConfig?: ProviderConfigContract;
};

type ProviderAttemptResult = {
  response: GatewayResponse;
  retryCount: number;
  fallbackUsed: boolean;
};

const generateWithRetries = async (
  provider: ModelProvider,
  request: GatewayRequest,
  config: ProviderConfigContract,
  maxRetries: number,
): Promise<{ response: GatewayResponse; failures: number }> => {
  let failures = 0;

  for (;;) {
    try {
      return { response: await provider.generateText(request, config), failures };
    } catch (error) {
      failures += 1;
      if (failures > maxRetries) {
        throw error;
      }
    }
  }
};

const generateWithOptionalFallback = async (
  primaryProvider: ModelProvider,
  request: GatewayRequest,
  config: ProviderConfigContract,
  options: Required<Pick<AiGatewayOptions, 'maxRetries'>> &
    Pick<AiGatewayOptions, 'fallbackProvider' | 'fallbackProviderConfig'>,
): Promise<ProviderAttemptResult> => {
  try {
    const primary = await generateWithRetries(primaryProvider, request, config, options.maxRetries);
    return {
      response: primary.response,
      retryCount: primary.failures,
      fallbackUsed: false,
    };
  } catch (primaryError) {
    if (!options.fallbackProvider) {
      throw primaryError;
    }

    if (!options.fallbackProviderConfig) {
      throw new Error(
        'Fallback provider config is required when a fallback provider is configured.',
      );
    }

    const fallback = await generateWithRetries(
      options.fallbackProvider,
      request,
      options.fallbackProviderConfig,
      0,
    );
    return {
      response: fallback.response,
      retryCount: options.maxRetries + 1,
      fallbackUsed: true,
    };
  }
};

const assertProviderConfigValidated = (config: ProviderConfigContract): void => {
  if (config.validationStatus === 'valid') {
    return;
  }

  if (config.validationStatus === 'invalid') {
    throw new Error(
      `Provider config validation failed: ${config.validationError}. Fix provider settings and validate again before retrying.`,
    );
  }

  throw new Error(
    'Provider config has not validated. Validate provider settings before requesting AI generation.',
  );
};

const estimateRequestInputTokens = (request: GatewayRequest): number =>
  request.messages.reduce((total, message) => total + countApproximateTokens(message.content), 0);

const assertRequestFitsContextCapacity = (
  request: GatewayRequest,
  config: ProviderConfigContract,
  model: ReturnType<typeof resolveConfiguredModel>,
): void => {
  const maxContextTokens = Math.min(
    config.capabilities.maxContextTokens,
    model.profile?.maxContextTokens ?? config.capabilities.maxContextTokens,
  );
  const estimatedInputTokens = estimateRequestInputTokens(request);

  if (estimatedInputTokens + request.maxOutputTokens > maxContextTokens) {
    throw new Error(
      `AI request exceeds provider context capacity. Lower max output tokens to ${maxContextTokens} or choose a larger-context model.`,
    );
  }
};

const assertProviderSupportsActionCapabilities = (
  action: ReturnType<typeof getAiAction>,
  config: ProviderConfigContract,
  model: ReturnType<typeof resolveConfiguredModel>,
): void => {
  if (
    action.outputContract &&
    (!config.capabilities.supportsStructuredOutput ||
      model.profile?.supportsStructuredOutput === false)
  ) {
    throw new Error(
      `AI action "${action.identifier}" requires structured output support. Choose a compatible provider or model and retry.`,
    );
  }
};

const parseStructuredResponseText = (
  action: ReturnType<typeof getAiAction>,
  text: string,
): void => {
  if (!action.outputContract) {
    return;
  }

  let parsedText: unknown;
  try {
    parsedText = JSON.parse(text);
  } catch {
    throw new Error(
      `AI action "${action.identifier}" returned invalid structured output JSON. Retry generation or choose a provider with structured output support.`,
    );
  }

  parseStructuredAiOutput(action.identifier, parsedText);
};

const validateRequestConfig = (
  request: GatewayRequest,
  action: ReturnType<typeof getAiAction>,
  config: ProviderConfigContract,
): ReturnType<typeof resolveConfiguredModel> => {
  if (request.tenantId !== config.tenantId) {
    throw new Error('Provider config tenant does not match the AI request tenant.');
  }

  assertProviderConfigValidated(config);

  const model = resolveConfiguredModel(action.identifier, config);
  if (!model.profile && isRegisteredModelName(model.name)) {
    throw new Error(
      `Configured model "${model.name}" does not support action "${action.identifier}" for provider "${config.providerType}". Choose a compatible model and retry.`,
    );
  }

  assertProviderSupportsActionCapabilities(action, config, model);
  assertRequestFitsContextCapacity(request, config, model);

  return model;
};

export const createAiGateway = (
  provider: ModelProvider,
  usageReader: TokenUsageReader,
  usageRecorder?: GatewayUsageRecorder,
  options: AiGatewayOptions = {},
): AiGateway => ({
  generate: async (rawRequest, rawConfig) => {
    const startedAt = Date.now();
    const request = GatewayRequest.parse(rawRequest);
    const config = ProviderConfig.parse(rawConfig);
    const action = getAiAction(request.actionIdentifier);
    const guardrailResult = checkPromptInjection(request.messages);

    if (!guardrailResult.allowed) {
      throw new Error(guardrailResult.reason);
    }

    const model = validateRequestConfig(request, action, config);
    const fallbackConfig = options.fallbackProviderConfig
      ? ProviderConfig.parse(options.fallbackProviderConfig)
      : undefined;
    if (options.fallbackProvider) {
      validateRequestConfig(request, action, fallbackConfig ?? config);
    }

    const usedTokens = await usageReader.getUsedTokens(request.tenantId, config.quota.period);
    if (usedTokens >= config.quota.hardCapTokensPerPeriod) {
      throw new Error('AI token quota is exhausted. Increase the tenant quota or wait for reset.');
    }

    if (
      usedTokens + estimateRequestInputTokens(request) + request.maxOutputTokens >
      config.quota.hardCapTokensPerPeriod
    ) {
      throw new Error('AI token quota is exhausted. Increase the tenant quota or wait for reset.');
    }

    const providerRequest = GatewayRequest.parse({
      ...request,
      messages: redactSensitiveGatewayMessages(request.messages),
    });
    const providerResult = await generateWithOptionalFallback(provider, providerRequest, config, {
      maxRetries: options.maxRetries ?? 0,
      fallbackProvider: options.fallbackProvider,
      fallbackProviderConfig: fallbackConfig,
    });
    const totalTokens =
      usedTokens +
      providerResult.response.usage.inputTokens +
      providerResult.response.usage.outputTokens;
    const attributedProviderType = providerResult.fallbackUsed
      ? providerResult.response.providerType
      : config.providerType;
    const attributedModel = providerResult.fallbackUsed
      ? providerResult.response.model
      : model.name;
    const parsedResponse = GatewayResponse.parse({
      ...providerResult.response,
      actionIdentifier: action.identifier,
      providerType: attributedProviderType,
      model: attributedModel,
      softQuotaExceeded: totalTokens >= config.quota.softWarnTokensPerPeriod,
    });
    parseStructuredResponseText(action, parsedResponse.text);
    const attributedModelProfile = providerResult.fallbackUsed
      ? findModelProfile(parsedResponse.model, action.identifier, parsedResponse.providerType)
      : model.profile;
    const estimatedCostCents = estimateModelCostCents(attributedModelProfile, parsedResponse.usage);

    await usageRecorder?.recordGeneration({
      tenantId: request.tenantId,
      actorId: request.actorId,
      actionIdentifier: action.identifier,
      contextPackageId: request.contextPackageId,
      promptIdentifier: request.promptIdentifier,
      promptVersion: request.promptVersion,
      providerType: parsedResponse.providerType,
      model: parsedResponse.model,
      inputTokens: parsedResponse.usage.inputTokens,
      outputTokens: parsedResponse.usage.outputTokens,
      durationMs: Date.now() - startedAt,
      retryCount: providerResult.retryCount,
      fallbackUsed: providerResult.fallbackUsed,
      estimatedCostCents,
    });

    if (totalTokens > config.quota.hardCapTokensPerPeriod) {
      throw new Error('AI token quota is exhausted. Increase the tenant quota or wait for reset.');
    }

    return parsedResponse;
  },
});
