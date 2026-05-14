import { z } from 'zod';
import { ContextPackageId, TenantId } from './ids.ts';

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

export const AiJobRecord = z
  .object({
    id: z.string().min(1),
    tenantId: TenantId,
    actionIdentifier: z.string().min(1),
    contextPackageId: ContextPackageId,
    promptIdentifier: z.string().min(1),
    promptVersion: z.string().min(1),
    idempotencyKey: z.string().min(1),
    status: AiJobStatus,
    attempts: z.number().int().nonnegative(),
    maxAttempts: z.number().int().positive(),
    output: AiJobOutput.nullable(),
    lastError: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((job, context) => {
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
export type AiJobRecord = z.infer<typeof AiJobRecord>;
