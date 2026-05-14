import { AiJobRecord, type AiJobRecord as AiJobRecordContract } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { processNextPersistentAiJob } from '../src/ai-jobs/worker-adapter.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const runningJob = AiJobRecord.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  actionIdentifier: 'feedback_draft',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  idempotencyKey: 'feedback-job-1',
  status: 'running',
  attempts: 1,
  maxAttempts: 2,
  output: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
});

describe('persistent AI job worker adapter', () => {
  it('claims a durable job and records executor output through Core ports', async () => {
    const completedJobs: AiJobRecordContract[] = [];

    const result = await processNextPersistentAiJob(
      {
        claimNext: async () => runningJob,
        complete: async (jobId, output) => {
          const completed = AiJobRecord.parse({
            ...runningJob,
            id: jobId,
            status: 'succeeded',
            output,
            updatedAt: now,
          });
          completedJobs.push(completed);
          return completed;
        },
        fail: async () => {
          throw new Error('Fail should not be called for successful jobs.');
        },
      },
      {
        feedback_draft: async () => ({
          text: 'Generated feedback',
          inputTokens: 10,
          outputTokens: 15,
          aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
          providerType: 'openai_compatible',
          model: 'feedback-model',
          estimatedCostCents: 0.018,
        }),
      },
    );

    expect(result.status).toBe('succeeded');
    expect(completedJobs[0]?.output?.text).toBe('Generated feedback');
    expect(completedJobs[0]?.output?.model).toBe('feedback-model');
  });

  it('records missing executors as retryable or terminal failures through Core ports', async () => {
    const failed = AiJobRecord.parse({
      ...runningJob,
      status: 'queued',
      lastError: 'No executor is registered for AI action "feedback_draft".',
    });

    const result = await processNextPersistentAiJob(
      {
        claimNext: async () => runningJob,
        complete: async () => {
          throw new Error('Complete should not be called without an executor.');
        },
        fail: async (_jobId, reason) =>
          AiJobRecord.parse({
            ...failed,
            lastError: reason,
          }),
      },
      {},
    );

    expect(result.status).toBe('retried');
    expect(result.job?.lastError).toBe('No executor is registered for AI action "feedback_draft".');
  });

  it('returns idle when Core has no queued job to claim', async () => {
    const result = await processNextPersistentAiJob(
      {
        claimNext: async () => null,
        complete: async () => {
          throw new Error('Complete should not be called when idle.');
        },
        fail: async () => {
          throw new Error('Fail should not be called when idle.');
        },
      },
      {},
    );

    expect(result).toEqual({ status: 'idle', job: null });
  });
});
