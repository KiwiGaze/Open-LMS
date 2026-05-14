import { describe, expect, it } from 'vitest';
import { AiJobRecord } from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const output = {
  text: 'Generated feedback',
  inputTokens: 10,
  outputTokens: 15,
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  providerType: 'openai_compatible',
  model: 'feedback-model',
  estimatedCostCents: 0.018,
};

const queuedJob = {
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  actionIdentifier: 'feedback_draft',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  idempotencyKey: 'feedback-job-1',
  status: 'queued',
  attempts: 0,
  maxAttempts: 2,
  output: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
};

describe('AI job contracts', () => {
  it('models queued and succeeded AI jobs with valid lifecycle state', () => {
    expect(AiJobRecord.parse(queuedJob).status).toBe('queued');
    expect(
      AiJobRecord.parse({
        ...queuedJob,
        status: 'succeeded',
        attempts: 1,
        output,
      }).output,
    ).toEqual(output);
  });

  it('rejects impossible AI job lifecycle states', () => {
    expect(() =>
      AiJobRecord.parse({
        ...queuedJob,
        status: 'succeeded',
        attempts: 1,
        output: null,
      }),
    ).toThrow();

    expect(() =>
      AiJobRecord.parse({
        ...queuedJob,
        output,
      }),
    ).toThrow();

    expect(() =>
      AiJobRecord.parse({
        ...queuedJob,
        status: 'failed',
        attempts: 2,
        lastError: null,
      }),
    ).toThrow();
  });
});
