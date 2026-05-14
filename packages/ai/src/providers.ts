import { lookup as lookupDns } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { ProviderConfig } from '@openlms/contracts';
import { z } from 'zod';
import type { GatewayResponse, ModelProvider } from './gateway.ts';
import { countApproximateTokens } from './token-estimation.ts';

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
export type ProviderLookupAddress = {
  address: string;
  family: 4 | 6;
};
export type ProviderDnsLookup = (hostname: string) => Promise<ProviderLookupAddress[]>;

export type OpenAiCompatibleProviderOptions = {
  apiKey: string;
  fetch?: FetchLike;
  lookup?: ProviderDnsLookup;
  timeoutMs?: number;
};
type ProviderRequestHeaders = RequestInit['headers'];
type ProviderRequestBody = RequestInit['body'];

const OpenAiCompatibleChatResponse = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative().optional(),
      completion_tokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

const selectConfiguredModel = (
  actionIdentifier: string,
  modelPreferences: {
    precheckModel?: string;
    feedbackDraftModel?: string;
    trendCardModel?: string;
    rubricClarityModel?: string;
    pageExplanationModel?: string;
    embeddingModel?: string;
  },
): string => {
  if (actionIdentifier === 'submission_precheck' && modelPreferences.precheckModel) {
    return modelPreferences.precheckModel;
  }

  if (actionIdentifier === 'feedback_draft' && modelPreferences.feedbackDraftModel) {
    return modelPreferences.feedbackDraftModel;
  }

  if (actionIdentifier === 'assignment_trend_card' && modelPreferences.trendCardModel) {
    return modelPreferences.trendCardModel;
  }

  if (actionIdentifier === 'rubric_clarity_review' && modelPreferences.rubricClarityModel) {
    return modelPreferences.rubricClarityModel;
  }

  if (actionIdentifier === 'page_explanation' && modelPreferences.pageExplanationModel) {
    return modelPreferences.pageExplanationModel;
  }

  return (
    modelPreferences.precheckModel ??
    modelPreferences.feedbackDraftModel ??
    modelPreferences.trendCardModel ??
    modelPreferences.rubricClarityModel ??
    modelPreferences.pageExplanationModel ??
    modelPreferences.embeddingModel ??
    'unspecified-model'
  );
};

const blockedProviderAddresses = new BlockList();
blockedProviderAddresses.addSubnet('0.0.0.0', 8, 'ipv4');
blockedProviderAddresses.addSubnet('10.0.0.0', 8, 'ipv4');
blockedProviderAddresses.addSubnet('127.0.0.0', 8, 'ipv4');
blockedProviderAddresses.addSubnet('169.254.0.0', 16, 'ipv4');
blockedProviderAddresses.addSubnet('172.16.0.0', 12, 'ipv4');
blockedProviderAddresses.addSubnet('192.168.0.0', 16, 'ipv4');
blockedProviderAddresses.addAddress('::', 'ipv6');
blockedProviderAddresses.addAddress('::1', 'ipv6');
blockedProviderAddresses.addSubnet('::ffff:0:0', 96, 'ipv6');
blockedProviderAddresses.addSubnet('fc00::', 7, 'ipv6');
blockedProviderAddresses.addSubnet('fe80::', 10, 'ipv6');

const isBlockedProviderAddress = (address: string): boolean => {
  const ipFamily = isIP(address);

  if (ipFamily === 4) {
    return blockedProviderAddresses.check(address, 'ipv4');
  }

  if (ipFamily !== 6) {
    return true;
  }

  return blockedProviderAddresses.check(address, 'ipv6');
};

const defaultProviderLookup: ProviderDnsLookup = async (hostname) => {
  const addresses = await lookupDns(hostname, { all: true, verbatim: true });
  return addresses.map((address) => {
    if (address.family !== 4 && address.family !== 6) {
      throw new Error(
        'Provider host resolved to an unsupported address family. Check the provider host and retry.',
      );
    }

    return {
      address: address.address,
      family: address.family,
    };
  });
};

const normalizeRequestHeaders = (
  headers: ProviderRequestHeaders | undefined,
  host: string,
): Record<string, string> => {
  const normalizedHeaders = new Headers(headers);
  normalizedHeaders.set('host', host);

  return Object.fromEntries(normalizedHeaders.entries());
};

const requestBodyToBuffer = (body: ProviderRequestBody | null | undefined): Buffer | undefined => {
  if (body === null || body === undefined) {
    return undefined;
  }

  if (typeof body === 'string') {
    return Buffer.from(body);
  }

  if (body instanceof URLSearchParams) {
    return Buffer.from(body.toString());
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }

  throw new Error(
    'OpenAI-compatible provider request body type is unsupported. Use a JSON string body and retry.',
  );
};

const guardedHttpsFetch =
  (lookup: ProviderDnsLookup): FetchLike =>
  async (url, init) => {
    const parsedUrl = new URL(url);
    const resolvedAddresses = await lookup(parsedUrl.hostname);

    if (
      resolvedAddresses.length === 0 ||
      resolvedAddresses.some((address) => isBlockedProviderAddress(address.address))
    ) {
      throw new Error(
        'Provider base URL must resolve to public host addresses. Check the provider host and retry.',
      );
    }

    const selectedAddress = resolvedAddresses[0];
    if (!selectedAddress) {
      throw new Error(
        'Provider base URL must resolve to public host addresses. Check the provider host and retry.',
      );
    }

    const body = requestBodyToBuffer(init.body);
    const headers = normalizeRequestHeaders(init.headers, parsedUrl.host);

    return new Promise<Response>((resolve, reject) => {
      const request = httpsRequest(
        {
          hostname: selectedAddress.address,
          port: parsedUrl.port ? Number(parsedUrl.port) : 443,
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          method: init.method,
          headers,
          servername: parsedUrl.hostname,
          signal: init.signal ?? undefined,
        },
        (response) => {
          const chunks: Buffer[] = [];

          response.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          response.on('end', () => {
            const responseHeaders = new Headers();
            for (const [headerName, headerValue] of Object.entries(response.headers)) {
              if (Array.isArray(headerValue)) {
                for (const value of headerValue) {
                  responseHeaders.append(headerName, value);
                }
              } else if (headerValue !== undefined) {
                responseHeaders.set(headerName, headerValue);
              }
            }

            resolve(
              new Response(Buffer.concat(chunks), {
                status: response.statusCode ?? 500,
                statusText: response.statusMessage,
                headers: responseHeaders,
              }),
            );
          });
        },
      );

      request.on('error', reject);

      if (body) {
        request.write(body);
      }

      request.end();
    });
  };

export const createLocalDevelopmentProvider = (
  text = 'Local development AI response',
): ModelProvider => ({
  generateText: async (request, config): Promise<GatewayResponse> => {
    const inputText = request.messages.map((message) => message.content).join('\n');

    return {
      actionIdentifier: request.actionIdentifier,
      providerType: config.providerType,
      model: selectConfiguredModel(request.actionIdentifier, config.modelPreferences),
      text,
      usage: {
        inputTokens: countApproximateTokens(inputText),
        outputTokens: countApproximateTokens(text),
      },
      softQuotaExceeded: false,
    };
  },
});

export const createOpenAiCompatibleProvider = (
  options: OpenAiCompatibleProviderOptions,
): ModelProvider => ({
  generateText: async (request, rawConfig): Promise<GatewayResponse> => {
    const config = ProviderConfig.parse(rawConfig);

    if (!config.baseUrl) {
      throw new Error(
        'OpenAI-compatible provider requires a base URL. Configure ProviderConfig and retry.',
      );
    }

    const model = selectConfiguredModel(request.actionIdentifier, config.modelPreferences);
    const fetchImpl = options.fetch ?? guardedHttpsFetch(options.lookup ?? defaultProviderLookup);
    const timeoutMs = options.timeoutMs ?? 30_000;
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    let response: Response;

    try {
      response = await fetchImpl(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          'content-type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_tokens: request.maxOutputTokens,
          response_format: config.capabilities.supportsStructuredOutput
            ? { type: 'json_object' }
            : undefined,
          metadata: {
            actionIdentifier: request.actionIdentifier,
            contextPackageId: request.contextPackageId,
            promptIdentifier: request.promptIdentifier,
            promptVersion: request.promptVersion,
          },
        }),
      });
    } catch (error) {
      if (abortController.signal.aborted) {
        throw new Error(
          `OpenAI-compatible provider request timed out after ${timeoutMs} ms. Increase the provider timeout or retry later.`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(
        `OpenAI-compatible provider request failed with status ${response.status}. Check the provider connection and retry.`,
      );
    }

    const payload = OpenAiCompatibleChatResponse.parse(await response.json());
    const text = payload.choices[0]?.message.content ?? '';

    return {
      actionIdentifier: request.actionIdentifier,
      providerType: config.providerType,
      model,
      text,
      usage: {
        inputTokens:
          payload.usage?.prompt_tokens ?? countApproximateTokens(JSON.stringify(request.messages)),
        outputTokens: payload.usage?.completion_tokens ?? countApproximateTokens(text),
      },
      softQuotaExceeded: false,
    };
  },
});
