import type { GatewayUsageRecorder } from '@openlms/ai/gateway';
import {
  AiGenerationLog,
  type AiGenerationLog as AiGenerationLogContract,
  AiUsageByAction,
  type AiUsageByAction as AiUsageByActionContract,
  AiUsageByActor,
  type AiUsageByActor as AiUsageByActorContract,
  AiUsageSummary,
  type AiUsageSummary as AiUsageSummaryContract,
  TenantId,
} from '@openlms/contracts';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { aiGenerationLog } from '../db/schema/ai-log.ts';
import { user } from '../db/schema/auth.ts';

export const saveAiGenerationLog = async (
  db: Database,
  value: AiGenerationLogContract,
): Promise<AiGenerationLogContract> => {
  const parsed = AiGenerationLog.parse(value);
  const [row] = await db.insert(aiGenerationLog).values(parsed).returning();

  if (!row) {
    throw new Error('AI generation log could not be saved because the database returned no row.');
  }

  return AiGenerationLog.parse(row);
};

export type GetAiUsageSummaryInput = {
  tenantId: string;
  from: Date;
  to: Date;
};

// Aggregates AI generation logs in a time window into a single usage summary
// (calls, tokens, duration, retries, fallbacks, estimated cost). Returns an
// all-zero summary when no rows match.
export const getAiUsageSummary = async (
  db: Database,
  input: GetAiUsageSummaryInput,
): Promise<AiUsageSummaryContract> => {
  const [row] = await db
    .select({
      totalCalls: sql<number>`count(*)::int`,
      totalInputTokens: sql<number>`coalesce(sum(${aiGenerationLog.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${aiGenerationLog.outputTokens}), 0)::int`,
      totalDurationMs: sql<number>`coalesce(sum(${aiGenerationLog.durationMs}), 0)::int`,
      totalRetryCount: sql<number>`coalesce(sum(${aiGenerationLog.retryCount}), 0)::int`,
      fallbackCount: sql<number>`coalesce(sum(case when ${aiGenerationLog.fallbackUsed} then 1 else 0 end), 0)::int`,
      estimatedCostCents: sql<number>`coalesce(sum(${aiGenerationLog.estimatedCostCents}), 0)::float8`,
    })
    .from(aiGenerationLog)
    .where(
      and(
        eq(aiGenerationLog.tenantId, TenantId.parse(input.tenantId)),
        gte(aiGenerationLog.createdAt, input.from),
        lte(aiGenerationLog.createdAt, input.to),
      ),
    );

  return AiUsageSummary.parse({
    tenantId: TenantId.parse(input.tenantId),
    from: input.from,
    to: input.to,
    totalCalls: row?.totalCalls ?? 0,
    totalInputTokens: row?.totalInputTokens ?? 0,
    totalOutputTokens: row?.totalOutputTokens ?? 0,
    totalDurationMs: row?.totalDurationMs ?? 0,
    totalRetryCount: row?.totalRetryCount ?? 0,
    fallbackCount: row?.fallbackCount ?? 0,
    estimatedCostCents: row?.estimatedCostCents ?? 0,
  });
};

// Per-action aggregation of AI logs. Rows are ordered alphabetically by
// actionIdentifier so output is stable for snapshot tests.
export const getAiUsageByAction = async (
  db: Database,
  input: GetAiUsageSummaryInput,
): Promise<AiUsageByActionContract[]> => {
  const rows = await db
    .select({
      actionIdentifier: aiGenerationLog.actionIdentifier,
      callCount: sql<number>`count(*)::int`,
      totalInputTokens: sql<number>`coalesce(sum(${aiGenerationLog.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${aiGenerationLog.outputTokens}), 0)::int`,
      estimatedCostCents: sql<number>`coalesce(sum(${aiGenerationLog.estimatedCostCents}), 0)::float8`,
    })
    .from(aiGenerationLog)
    .where(
      and(
        eq(aiGenerationLog.tenantId, TenantId.parse(input.tenantId)),
        gte(aiGenerationLog.createdAt, input.from),
        lte(aiGenerationLog.createdAt, input.to),
      ),
    )
    .groupBy(aiGenerationLog.actionIdentifier)
    .orderBy(asc(aiGenerationLog.actionIdentifier));

  return rows.map((row) =>
    AiUsageByAction.parse({
      actionIdentifier: row.actionIdentifier,
      callCount: row.callCount,
      totalInputTokens: row.totalInputTokens,
      totalOutputTokens: row.totalOutputTokens,
      estimatedCostCents: row.estimatedCostCents,
    }),
  );
};

// Per-actor aggregation of AI logs. Rows are ordered by total tokens
// descending (top consumers first) and include the actor's display name and
// email when the user row is still present. Anonymous actors (no actorId on
// the log row) are aggregated into a single null-actor row.
export const getAiUsageByActor = async (
  db: Database,
  input: GetAiUsageSummaryInput,
): Promise<AiUsageByActorContract[]> => {
  const rows = await db
    .select({
      actorUserId: aiGenerationLog.actorId,
      actorName: user.name,
      actorEmail: user.email,
      callCount: sql<number>`count(*)::int`,
      totalInputTokens: sql<number>`coalesce(sum(${aiGenerationLog.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${aiGenerationLog.outputTokens}), 0)::int`,
      estimatedCostCents: sql<number>`coalesce(sum(${aiGenerationLog.estimatedCostCents}), 0)::float8`,
    })
    .from(aiGenerationLog)
    .leftJoin(user, eq(user.id, aiGenerationLog.actorId))
    .where(
      and(
        eq(aiGenerationLog.tenantId, TenantId.parse(input.tenantId)),
        gte(aiGenerationLog.createdAt, input.from),
        lte(aiGenerationLog.createdAt, input.to),
      ),
    )
    .groupBy(aiGenerationLog.actorId, user.name, user.email)
    .orderBy(
      desc(
        sql`coalesce(sum(${aiGenerationLog.inputTokens}), 0) + coalesce(sum(${aiGenerationLog.outputTokens}), 0)`,
      ),
    );

  return rows.map((row) =>
    AiUsageByActor.parse({
      actorUserId: row.actorUserId,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      callCount: row.callCount,
      totalInputTokens: row.totalInputTokens,
      totalOutputTokens: row.totalOutputTokens,
      estimatedCostCents: row.estimatedCostCents,
    }),
  );
};

export const createDbGatewayUsageRecorder = (
  db: Database,
  makeId: () => string,
  now: () => Date,
): GatewayUsageRecorder => ({
  recordGeneration: async (record) => {
    await saveAiGenerationLog(
      db,
      AiGenerationLog.parse({
        id: makeId(),
        tenantId: record.tenantId,
        actorId: record.actorId,
        actionIdentifier: record.actionIdentifier,
        contextPackageId: record.contextPackageId,
        promptIdentifier: record.promptIdentifier,
        promptVersion: record.promptVersion,
        providerType: record.providerType,
        model: record.model,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        durationMs: record.durationMs,
        retryCount: record.retryCount,
        fallbackUsed: record.fallbackUsed,
        estimatedCostCents: record.estimatedCostCents,
        createdAt: now(),
      }),
    );
  },
});
