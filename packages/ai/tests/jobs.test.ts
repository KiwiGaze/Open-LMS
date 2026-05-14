import { describe, expect, it } from 'vitest';
import { AiJob, createInMemoryAiJobQueue } from '../src/jobs.ts';

const baseJob = {
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  actionIdentifier: 'feedback_draft',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  idempotencyKey: 'feedback-draft-job-1',
  maxAttempts: 2,
};

const output = {
  text: 'draft feedback',
  inputTokens: 12,
  outputTokens: 18,
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  providerType: 'openai_compatible',
  model: 'feedback-model',
  estimatedCostCents: 0.018,
};

describe('AI async job queue', () => {
  it('rejects impossible local AI job lifecycle states', () => {
    expect(() =>
      AiJob.parse({
        ...baseJob,
        id: 'job-1',
        status: 'succeeded',
        attempts: 1,
        output: null,
        lastError: null,
      }),
    ).toThrow();

    expect(() =>
      AiJob.parse({
        ...baseJob,
        id: 'job-1',
        status: 'queued',
        attempts: 0,
        output,
        lastError: null,
      }),
    ).toThrow();
  });

  it('enqueues jobs idempotently and claims them in FIFO order', () => {
    const queue = createInMemoryAiJobQueue(() => 'job-1');

    const first = queue.enqueue(baseJob);
    const duplicate = queue.enqueue(baseJob);
    const claimed = queue.claimNext();

    expect(duplicate.id).toBe(first.id);
    expect(claimed).toEqual(expect.objectContaining({ id: 'job-1', status: 'running' }));
    expect(queue.claimNext()).toBeNull();
  });

  it('records completion with output metadata', () => {
    const queue = createInMemoryAiJobQueue(() => 'job-1');
    const job = queue.enqueue(baseJob);

    queue.claimNext();
    const completed = queue.complete(job.id, output);

    expect(completed.status).toBe('succeeded');
    expect(completed.output?.text).toBe('draft feedback');
    expect(completed.output).toEqual(expect.objectContaining({ model: 'feedback-model' }));
  });

  it('rejects empty completion output text', () => {
    const queue = createInMemoryAiJobQueue(() => 'job-1');
    const job = queue.enqueue(baseJob);

    queue.claimNext();

    expect(() => queue.complete(job.id, { ...output, text: '' })).toThrow();
  });

  it('requeues retryable failures until attempts are exhausted', () => {
    const queue = createInMemoryAiJobQueue(() => 'job-1');
    const job = queue.enqueue(baseJob);

    queue.claimNext();
    const retry = queue.fail(job.id, 'Provider timeout.');

    expect(retry.status).toBe('queued');
    expect(retry.lastError).toBe('Provider timeout.');

    queue.claimNext();
    const failed = queue.fail(job.id, 'Provider timeout again.');

    expect(failed.status).toBe('failed');
    expect(failed.lastError).toBe('Provider timeout again.');
  });
});
