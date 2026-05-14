import { describe, expect, it } from 'vitest';
import { createInMemoryAiJobQueue } from '../src/jobs.ts';
import { processNextAiJob } from '../src/worker.ts';

const enqueueFeedbackJob = (queue: ReturnType<typeof createInMemoryAiJobQueue>, maxAttempts = 2) =>
  queue.enqueue({
    tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
    actionIdentifier: 'feedback_draft',
    contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
    promptIdentifier: 'feedback_draft.default',
    promptVersion: '2026-05-10.1',
    idempotencyKey: 'feedback-job-1',
    maxAttempts,
  });

describe('AI job worker', () => {
  it('claims the next queued job and completes it with executor output', async () => {
    const queue = createInMemoryAiJobQueue(() => 'job-1');
    const job = enqueueFeedbackJob(queue);

    const result = await processNextAiJob(queue, {
      feedback_draft: async () => ({
        text: 'Generated feedback',
        inputTokens: 10,
        outputTokens: 20,
        aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
        providerType: 'openai_compatible',
        model: 'feedback-model',
        estimatedCostCents: 0.018,
      }),
    });

    expect(result.status).toBe('succeeded');
    expect(queue.getById(job.id)?.output?.text).toBe('Generated feedback');
    expect(queue.getById(job.id)?.output?.model).toBe('feedback-model');
  });

  it('requeues transient failures until max attempts is reached', async () => {
    const queue = createInMemoryAiJobQueue(() => 'job-1');
    const job = enqueueFeedbackJob(queue, 2);

    const first = await processNextAiJob(queue, {
      feedback_draft: async () => {
        throw new Error('Provider timeout');
      },
    });
    const second = await processNextAiJob(queue, {
      feedback_draft: async () => {
        throw new Error('Provider timeout');
      },
    });

    expect(first.status).toBe('retried');
    expect(second.status).toBe('failed');
    expect(queue.getById(job.id)?.lastError).toBe('Provider timeout');
  });
});
