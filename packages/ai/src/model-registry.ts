import { ProviderConfig, type ProviderConfig as ProviderConfigContract } from '@openlms/contracts';
import { z } from 'zod';
import { getAiAction } from './actions.ts';

export const AiModelProfile = z
  .object({
    name: z.string().min(1),
    providerTypes: z
      .array(
        z.enum(['openai', 'anthropic', 'google', 'azure_openai', 'openai_compatible', 'local']),
      )
      .min(1),
    supportedActionIdentifiers: z.array(z.string().min(1)).min(1),
    supportsStructuredOutput: z.boolean(),
    supportsTools: z.boolean(),
    supportsVision: z.boolean(),
    supportsPromptCaching: z.boolean(),
    supportsDeterministic: z.boolean(),
    maxContextTokens: z.number().int().positive(),
    inputCostCentsPerThousandTokens: z.number().nonnegative(),
    outputCostCentsPerThousandTokens: z.number().nonnegative(),
    latencyClass: z.enum(['low', 'medium', 'high']),
    localCompatible: z.boolean(),
  })
  .strict();
export type AiModelProfile = z.infer<typeof AiModelProfile>;

export type ResolvedConfiguredModel = {
  name: string;
  profile: AiModelProfile | null;
};

export const defaultModelRegistry = [
  {
    name: 'gpt-4.1-mini',
    providerTypes: ['openai', 'azure_openai', 'openai_compatible'],
    supportedActionIdentifiers: [
      'submission_precheck',
      'feedback_draft',
      'assignment_trend_card',
      'rubric_clarity_review',
      'page_explanation',
    ],
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsDeterministic: true,
    maxContextTokens: 128000,
    inputCostCentsPerThousandTokens: 0.04,
    outputCostCentsPerThousandTokens: 0.16,
    latencyClass: 'medium',
    localCompatible: false,
  },
  {
    name: 'local-llm',
    providerTypes: ['local', 'openai_compatible'],
    supportedActionIdentifiers: [
      'submission_precheck',
      'rubric_clarity_review',
      'page_explanation',
    ],
    supportsStructuredOutput: false,
    supportsTools: false,
    supportsVision: false,
    supportsPromptCaching: false,
    supportsDeterministic: true,
    maxContextTokens: 8192,
    inputCostCentsPerThousandTokens: 0,
    outputCostCentsPerThousandTokens: 0,
    latencyClass: 'low',
    localCompatible: true,
  },
] satisfies AiModelProfile[];

const preferenceForAction = (
  actionIdentifier: string,
  config: ProviderConfigContract,
): string | undefined => {
  if (actionIdentifier === 'submission_precheck') {
    return config.modelPreferences.precheckModel;
  }

  if (actionIdentifier === 'feedback_draft') {
    return config.modelPreferences.feedbackDraftModel;
  }

  if (actionIdentifier === 'assignment_trend_card') {
    return config.modelPreferences.trendCardModel;
  }

  if (actionIdentifier === 'rubric_clarity_review') {
    return config.modelPreferences.rubricClarityModel;
  }

  if (actionIdentifier === 'page_explanation') {
    return config.modelPreferences.pageExplanationModel;
  }

  return undefined;
};

const firstConfiguredModel = (config: ProviderConfigContract): string =>
  config.modelPreferences.precheckModel ??
  config.modelPreferences.feedbackDraftModel ??
  config.modelPreferences.trendCardModel ??
  config.modelPreferences.rubricClarityModel ??
  config.modelPreferences.pageExplanationModel ??
  config.modelPreferences.embeddingModel ??
  'unspecified-model';

export const findModelProfile = (
  modelName: string,
  actionIdentifier: string,
  providerType: string,
  registry = defaultModelRegistry,
): AiModelProfile | null =>
  registry.find(
    (profile) =>
      profile.name === modelName &&
      profile.providerTypes.some(
        (registeredProviderType) => registeredProviderType === providerType,
      ) &&
      profile.supportedActionIdentifiers.includes(actionIdentifier),
  ) ?? null;

export const resolveConfiguredModel = (
  actionIdentifier: string,
  rawConfig: ProviderConfigContract,
  registry = defaultModelRegistry,
): ResolvedConfiguredModel => {
  const action = getAiAction(actionIdentifier);
  const config = ProviderConfig.parse(rawConfig);
  const modelName = preferenceForAction(action.identifier, config) ?? firstConfiguredModel(config);

  return {
    name: modelName,
    profile: findModelProfile(modelName, action.identifier, config.providerType, registry),
  };
};

export const isRegisteredModelName = (
  modelName: string,
  registry = defaultModelRegistry,
): boolean => registry.some((profile) => profile.name === modelName);

export const estimateModelCostCents = (
  profile: AiModelProfile | null,
  usage: { inputTokens: number; outputTokens: number },
): number | null => {
  if (!profile) {
    return null;
  }

  const inputCost = (usage.inputTokens / 1000) * profile.inputCostCentsPerThousandTokens;
  const outputCost = (usage.outputTokens / 1000) * profile.outputCostCentsPerThousandTokens;

  return Number((inputCost + outputCost).toFixed(6));
};
