import { z } from 'zod';
import { AiGenerationLogId, ContextPackageId, TenantId, UserId } from './ids.ts';

export const AiGenerationLog = z.object({
  id: AiGenerationLogId,
  tenantId: TenantId,
  actorId: UserId.nullable(),
  actionIdentifier: z.string().min(1),
  contextPackageId: ContextPackageId,
  promptIdentifier: z.string().min(1),
  promptVersion: z.string().min(1),
  providerType: z.string().min(1),
  model: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
  fallbackUsed: z.boolean(),
  estimatedCostCents: z.number().nonnegative().nullable(),
  createdAt: z.date(),
});
export type AiGenerationLog = z.infer<typeof AiGenerationLog>;

export const AiUsageSummary = z
  .object({
    tenantId: TenantId,
    from: z.date(),
    to: z.date(),
    totalCalls: z.number().int().nonnegative(),
    totalInputTokens: z.number().int().nonnegative(),
    totalOutputTokens: z.number().int().nonnegative(),
    totalDurationMs: z.number().int().nonnegative(),
    totalRetryCount: z.number().int().nonnegative(),
    fallbackCount: z.number().int().nonnegative(),
    estimatedCostCents: z.number().nonnegative(),
  })
  .strict();
export type AiUsageSummary = z.infer<typeof AiUsageSummary>;

export const AiUsageByAction = z
  .object({
    actionIdentifier: z.string().min(1),
    callCount: z.number().int().nonnegative(),
    totalInputTokens: z.number().int().nonnegative(),
    totalOutputTokens: z.number().int().nonnegative(),
    estimatedCostCents: z.number().nonnegative(),
  })
  .strict();
export type AiUsageByAction = z.infer<typeof AiUsageByAction>;

export const AiUsageByActor = z
  .object({
    actorUserId: UserId.nullable(),
    actorName: z.string().min(1).nullable(),
    actorEmail: z.string().min(1).nullable(),
    callCount: z.number().int().nonnegative(),
    totalInputTokens: z.number().int().nonnegative(),
    totalOutputTokens: z.number().int().nonnegative(),
    estimatedCostCents: z.number().nonnegative(),
  })
  .strict();
export type AiUsageByActor = z.infer<typeof AiUsageByActor>;
