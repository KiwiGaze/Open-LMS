import { z } from 'zod';
import { ProviderConfigId, TenantId } from './ids.ts';

export const AiProviderType = z.enum([
  'openai',
  'anthropic',
  'google',
  'azure_openai',
  'openai_compatible',
  'local',
]);
export type AiProviderType = z.infer<typeof AiProviderType>;

export const ProviderConfigValidationStatus = z.enum(['pending', 'valid', 'invalid']);
export type ProviderConfigValidationStatus = z.infer<typeof ProviderConfigValidationStatus>;

export const ModelPreferences = z
  .object({
    precheckModel: z.string().min(1).optional(),
    feedbackDraftModel: z.string().min(1).optional(),
    trendCardModel: z.string().min(1).optional(),
    rubricClarityModel: z.string().min(1).optional(),
    pageExplanationModel: z.string().min(1).optional(),
    embeddingModel: z.string().min(1).optional(),
    rerankModel: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((preferences, context) => {
    const configuredModels = [
      preferences.precheckModel,
      preferences.feedbackDraftModel,
      preferences.trendCardModel,
      preferences.rubricClarityModel,
      preferences.pageExplanationModel,
      preferences.embeddingModel,
      preferences.rerankModel,
    ];

    if (!configuredModels.some((model) => model !== undefined)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provider config requires at least one model preference.',
        path: [],
      });
    }
  });
export type ModelPreferences = z.infer<typeof ModelPreferences>;

export const ProviderCapabilities = z
  .object({
    supportsStructuredOutput: z.boolean(),
    supportsTools: z.boolean(),
    supportsVision: z.boolean(),
    supportsPromptCaching: z.boolean(),
    maxContextTokens: z.number().int().positive(),
    supportsDeterministic: z.boolean(),
  })
  .strict();
export type ProviderCapabilities = z.infer<typeof ProviderCapabilities>;

export const ProviderQuota = z
  .object({
    softWarnTokensPerPeriod: z.number().int().nonnegative(),
    hardCapTokensPerPeriod: z.number().int().positive(),
    period: z.enum(['day', 'week', 'month']),
  })
  .strict()
  .superRefine((quota, context) => {
    if (quota.softWarnTokensPerPeriod > quota.hardCapTokensPerPeriod) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provider quota soft warning threshold cannot exceed the hard cap.',
        path: ['softWarnTokensPerPeriod'],
      });
    }
  });
export type ProviderQuota = z.infer<typeof ProviderQuota>;

const base64ByteLength = (value: string): number | null => {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return null;
  }

  let padding = 0;
  if (value.endsWith('==')) {
    padding = 2;
  } else if (value.endsWith('=')) {
    padding = 1;
  }

  return (value.length / 4) * 3 - padding;
};

export const EncryptedApiKey = z
  .string()
  .min(1)
  .superRefine((value, context) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Encrypted API key must be a serialized encrypted secret.',
      });
      return;
    }

    const encrypted = z
      .object({
        ciphertextBase64: z.string().min(1),
        ivBase64: z.string().min(1),
        authTagBase64: z.string().min(1),
      })
      .strict()
      .safeParse(parsed);

    if (!encrypted.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Encrypted API key must include ciphertext, IV, and authentication tag.',
      });
      return;
    }

    const ciphertextBytes = base64ByteLength(encrypted.data.ciphertextBase64);
    const ivBytes = base64ByteLength(encrypted.data.ivBase64);
    const authTagBytes = base64ByteLength(encrypted.data.authTagBase64);

    if (ciphertextBytes === null || ciphertextBytes < 1 || ivBytes !== 12 || authTagBytes !== 16) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Encrypted API key payload is malformed. Re-enter the provider secret and retry.',
      });
    }
  });

const isPrivateIpv4 = (hostname: string): boolean => {
  const octets = hostname.split('.').map((octet) => Number(octet));

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second] = octets;
  if (first === undefined || second === undefined) {
    return false;
  }

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isBlockedProviderHostname = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase().replace(/^\[(.*)\]$/, '$1');

  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local')
  ) {
    return true;
  }

  if (normalized.includes(':')) {
    return true;
  }

  return isPrivateIpv4(normalized);
};

export const ProviderBaseUrl = z
  .string()
  .url()
  .superRefine((value, context) => {
    const url = new URL(value);

    if (url.protocol !== 'https:') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provider base URL must use HTTPS.',
      });
    }

    if (isBlockedProviderHostname(url.hostname)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provider base URL must use a public host.',
      });
    }
  });

export const ProviderConfig = z
  .object({
    id: ProviderConfigId,
    tenantId: TenantId,
    providerType: AiProviderType,
    baseUrl: ProviderBaseUrl.nullable(),
    encryptedApiKey: EncryptedApiKey,
    modelPreferences: ModelPreferences,
    capabilities: ProviderCapabilities,
    quota: ProviderQuota,
    validationStatus: ProviderConfigValidationStatus.default('pending'),
    validationError: z.string().min(1).nullable().default(null),
    validatedAt: z.date().nullable().default(null),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((config, context) => {
    if (config.validationStatus !== 'pending' && !config.validatedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Completed provider config validation states require a validation timestamp.',
        path: ['validatedAt'],
      });
    }

    if (config.validationStatus === 'invalid' && !config.validationError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid provider configs require a validation error.',
        path: ['validationError'],
      });
    }

    if (config.validationStatus !== 'invalid' && config.validationError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only invalid provider configs may include a validation error.',
        path: ['validationError'],
      });
    }

    if (config.validationStatus === 'pending' && config.validatedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pending provider configs cannot include a validation timestamp.',
        path: ['validatedAt'],
      });
    }
  });
export type ProviderConfig = z.infer<typeof ProviderConfig>;

// Public-safe view of a provider config — omits the encrypted API key so it
// can be returned to admin UIs without exposing credential material.
export const ProviderConfigSummary = z
  .object({
    id: ProviderConfigId,
    tenantId: TenantId,
    providerType: AiProviderType,
    baseUrl: ProviderBaseUrl.nullable(),
    modelPreferences: ModelPreferences,
    capabilities: ProviderCapabilities,
    quota: ProviderQuota,
    validationStatus: ProviderConfigValidationStatus,
    validationError: z.string().min(1).nullable(),
    validatedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type ProviderConfigSummary = z.infer<typeof ProviderConfigSummary>;
