import { ProviderConfig, type ProviderConfig as ProviderConfigContract } from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { GatewayRequest } from '../src/gateway.ts';
import {
  createLocalDevelopmentProvider,
  createOpenAiCompatibleProvider,
} from '../src/providers.ts';

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
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
});

const request: GatewayRequest = {
  actionIdentifier: 'feedback_draft',
  tenantId: config.tenantId,
  actorId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  messages: [{ role: 'user', content: 'Draft feedback.' }],
  maxOutputTokens: 500,
};

describe('AI model providers', () => {
  it('provides a local development path without external network calls', async () => {
    const provider = createLocalDevelopmentProvider('local response');

    const response = await provider.generateText(request, {
      ...config,
      providerType: 'local',
      baseUrl: null,
    });

    expect(response.providerType).toBe('local');
    expect(response.text).toBe('local response');
    expect(response.usage.outputTokens).toBeGreaterThan(0);
  });

  it('maps OpenAI-compatible chat responses without exposing encrypted keys', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchJson = {
      choices: [{ message: { content: 'provider feedback' } }],
      usage: { prompt_tokens: 11, completion_tokens: 17 },
    };
    const fetchImpl = async (
      url: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify(fetchJson), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const provider = createOpenAiCompatibleProvider({
      apiKey: 'plaintext-provider-key',
      fetch: fetchImpl,
    });

    const response = await provider.generateText(request, config);

    expect(response.text).toBe('provider feedback');
    expect(response.usage).toEqual({ inputTokens: 11, outputTokens: 17 });
    expect(calls[0]?.url).toBe('https://models.example.test/v1/chat/completions');
    expect(calls[0]?.init.headers).toEqual(
      expect.objectContaining({ authorization: 'Bearer plaintext-provider-key' }),
    );
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(calls[0]?.init.body)).not.toContain(config.encryptedApiKey);
  });

  it('rejects OpenAI-compatible provider hosts that resolve to private addresses', async () => {
    const provider = createOpenAiCompatibleProvider({
      apiKey: 'plaintext-provider-key',
      lookup: async (hostname: string) => {
        expect(hostname).toBe('127.0.0.1.nip.io');
        return [{ address: '127.0.0.1', family: 4 }];
      },
    });

    await expect(
      provider.generateText(request, {
        ...config,
        baseUrl: 'https://127.0.0.1.nip.io/v1',
      }),
    ).rejects.toThrow(/public host/i);
  });

  it('aborts OpenAI-compatible provider calls that exceed the configured timeout', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetchImpl = async (
      _url: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      signal = init?.signal ?? undefined;

      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    };
    const provider = createOpenAiCompatibleProvider({
      apiKey: 'plaintext-provider-key',
      fetch: fetchImpl,
      timeoutMs: 25,
    });

    const pending = provider.generateText(request, config);
    const rejection = expect(pending).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(25);

    await rejection;
    expect(signal?.aborted).toBe(true);
    vi.useRealTimers();
  });

  it('rejects hosted provider calls without a base URL', async () => {
    const provider = createOpenAiCompatibleProvider({
      apiKey: 'plaintext-provider-key',
      fetch: async () => new Response('{}'),
    });

    await expect(
      provider.generateText(request, {
        ...config,
        baseUrl: null,
      } satisfies ProviderConfigContract),
    ).rejects.toThrow(/base URL/);
  });
});
