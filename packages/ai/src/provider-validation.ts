import { ProviderConfig, type ProviderConfig as ProviderConfigContract } from '@openlms/contracts';
import { aiActions } from './actions.ts';
import { type GatewayRequest, GatewayResponse, type ModelProvider } from './gateway.ts';
import { isRegisteredModelName, resolveConfiguredModel } from './model-registry.ts';
import { parseStructuredAiOutput } from './structured-output.ts';

export type ProviderConfigValidationResult =
  | {
      validationStatus: 'valid';
      validationError: null;
    }
  | {
      validationStatus: 'invalid';
      validationError: string;
    };

const validationPromptVersion = '2026-05-10.1';

const errorMessageFor = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : 'Provider validation failed.';

export const providerValidationActionIdentifiers = aiActions.map((action) => action.identifier);

const parseValidationStructuredResponseText = (actionIdentifier: string, text: string): void => {
  let parsedText: unknown;
  try {
    parsedText = JSON.parse(text);
  } catch {
    throw new Error(
      `AI action "${actionIdentifier}" returned invalid structured output JSON. Choose a provider with structured output support and retry validation.`,
    );
  }

  parseStructuredAiOutput(actionIdentifier, parsedText);
};

const findConfiguredModelCompatibilityError = (config: ProviderConfigContract): string | null => {
  for (const action of aiActions) {
    const model = resolveConfiguredModel(action.identifier, config);
    if (!model.profile && isRegisteredModelName(model.name)) {
      return `Configured model "${model.name}" does not support action "${action.identifier}" for provider "${config.providerType}". Choose a compatible model and retry validation.`;
    }
  }

  for (const action of aiActions) {
    const model = resolveConfiguredModel(action.identifier, config);
    if (
      action.outputContract &&
      (!config.capabilities.supportsStructuredOutput ||
        model.profile?.supportsStructuredOutput === false)
    ) {
      return `AI action "${action.identifier}" requires structured output support. Choose a compatible provider or model and retry validation.`;
    }
  }

  return null;
};

export const validateProviderConfig = async (
  provider: ModelProvider,
  rawConfig: ProviderConfigContract,
): Promise<ProviderConfigValidationResult> => {
  const config = ProviderConfig.parse(rawConfig);
  const compatibilityError = findConfiguredModelCompatibilityError(config);
  if (compatibilityError) {
    return {
      validationStatus: 'invalid',
      validationError: compatibilityError,
    };
  }

  const request: GatewayRequest = {
    actionIdentifier: 'page_explanation',
    tenantId: config.tenantId,
    actorId: null,
    contextPackageId: `provider-config:${config.id}:validation`,
    promptIdentifier: 'provider_config.validation',
    promptVersion: validationPromptVersion,
    messages: [
      {
        role: 'user',
        content:
          'Return JSON with answer, keyPoints, citedResourceIds, and followUpQuestions fields for provider validation.',
      },
    ],
    maxOutputTokens: 512,
  };

  try {
    const response = GatewayResponse.parse(await provider.generateText(request, config));
    parseValidationStructuredResponseText(request.actionIdentifier, response.text);
    return {
      validationStatus: 'valid',
      validationError: null,
    };
  } catch (error) {
    return {
      validationStatus: 'invalid',
      validationError: `${errorMessageFor(error)} Check provider settings and retry validation.`,
    };
  }
};
