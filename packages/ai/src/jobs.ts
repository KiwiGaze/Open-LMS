import { z } from 'zod';

export const AiJobStatus = z.enum(['queued', 'running', 'succeeded', 'failed']);
export type AiJobStatus = z.infer<typeof AiJobStatus>;

export const AiJobOutput = z
  .object({
    text: z.string().min(1),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    aiGenerationLogId: z.string().min(1),
    providerType: z.string().min(1),
    model: z.string().min(1),
    estimatedCostCents: z.number().nonnegative().nullable(),
  })
  .strict();
export type AiJobOutput = z.infer<typeof AiJobOutput>;

export const EnqueueAiJobInput = z
  .object({
    tenantId: z.string().min(1),
    actionIdentifier: z.string().min(1),
    contextPackageId: z.string().min(1),
    promptIdentifier: z.string().min(1),
    promptVersion: z.string().min(1),
    idempotencyKey: z.string().min(1),
    maxAttempts: z.number().int().positive(),
  })
  .strict();
export type EnqueueAiJobInput = z.infer<typeof EnqueueAiJobInput>;

export const AiJob = EnqueueAiJobInput.extend({
  id: z.string().min(1),
  status: AiJobStatus,
  attempts: z.number().int().nonnegative(),
  output: AiJobOutput.nullable(),
  lastError: z.string().nullable(),
}).superRefine((job, context) => {
  if (job.status === 'succeeded') {
    if (!job.output) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Succeeded AI jobs require generation output.',
        path: ['output'],
      });
    }

    if (job.lastError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Succeeded AI jobs cannot keep a last error.',
        path: ['lastError'],
      });
    }

    return;
  }

  if (job.output) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only succeeded AI jobs can include generation output.',
      path: ['output'],
    });
  }

  if (job.status === 'failed' && !job.lastError) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Failed AI jobs require a last error.',
      path: ['lastError'],
    });
  }
});
export type AiJob = z.infer<typeof AiJob>;

export type AiJobQueue = {
  enqueue: (input: EnqueueAiJobInput) => AiJob;
  claimNext: () => AiJob | null;
  complete: (jobId: string, output: AiJobOutput) => AiJob;
  fail: (jobId: string, reason: string) => AiJob;
  getById: (jobId: string) => AiJob | null;
};

const cloneJob = (job: AiJob): AiJob => AiJob.parse(job);

export const createInMemoryAiJobQueue = (makeId: () => string): AiJobQueue => {
  const jobs = new Map<string, AiJob>();
  const idempotencyIndex = new Map<string, string>();

  const getExistingJob = (input: EnqueueAiJobInput): AiJob | null => {
    const existingId = idempotencyIndex.get(`${input.tenantId}:${input.idempotencyKey}`);
    if (!existingId) {
      return null;
    }

    const existing = jobs.get(existingId);
    return existing ? cloneJob(existing) : null;
  };

  const getMutableJob = (jobId: string): AiJob => {
    const job = jobs.get(jobId);
    if (!job) {
      throw new Error('AI job was not found. Refresh the job state and retry.');
    }
    return job;
  };

  return {
    enqueue: (rawInput) => {
      const input = EnqueueAiJobInput.parse(rawInput);
      const existing = getExistingJob(input);
      if (existing) {
        return existing;
      }

      const job = AiJob.parse({
        ...input,
        id: makeId(),
        status: 'queued',
        attempts: 0,
        output: null,
        lastError: null,
      });
      jobs.set(job.id, job);
      idempotencyIndex.set(`${job.tenantId}:${job.idempotencyKey}`, job.id);
      return cloneJob(job);
    },

    claimNext: () => {
      const job = [...jobs.values()].find((candidate) => candidate.status === 'queued');
      if (!job) {
        return null;
      }

      job.status = 'running';
      job.attempts += 1;
      return cloneJob(job);
    },

    complete: (jobId, rawOutput) => {
      const output = AiJobOutput.parse(rawOutput);
      const job = getMutableJob(jobId);

      if (job.status !== 'running') {
        throw new Error('AI job cannot be completed unless it is running.');
      }

      job.status = 'succeeded';
      job.output = output;
      job.lastError = null;
      return cloneJob(job);
    },

    fail: (jobId, reason) => {
      const job = getMutableJob(jobId);

      if (job.status !== 'running') {
        throw new Error('AI job cannot fail unless it is running.');
      }

      job.lastError = reason;
      job.status = job.attempts < job.maxAttempts ? 'queued' : 'failed';
      return cloneJob(job);
    },

    getById: (jobId) => {
      const job = jobs.get(jobId);
      return job ? cloneJob(job) : null;
    },
  };
};
