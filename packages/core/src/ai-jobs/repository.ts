import {
  AiJobOutput,
  type AiJobOutput as AiJobOutputContract,
  AiJobRecord,
  type AiJobRecord as AiJobRecordContract,
} from '@openlms/contracts';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { aiJob } from '../db/schema/ai-job.ts';

const parseAiJobRow = (row: unknown): AiJobRecordContract => {
  const raw = row as Record<string, unknown>;

  if ('tenant_id' in raw) {
    return AiJobRecord.parse({
      id: raw.id,
      tenantId: raw.tenant_id,
      actionIdentifier: raw.action_identifier,
      contextPackageId: raw.context_package_id,
      promptIdentifier: raw.prompt_identifier,
      promptVersion: raw.prompt_version,
      idempotencyKey: raw.idempotency_key,
      status: raw.status,
      attempts: raw.attempts,
      maxAttempts: raw.max_attempts,
      output: raw.output,
      lastError: raw.last_error,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  return AiJobRecord.parse(row);
};

export const saveAiJob = async (
  db: Database,
  value: AiJobRecordContract,
): Promise<AiJobRecordContract> => {
  const parsed = AiJobRecord.parse(value);
  const [row] = await db
    .insert(aiJob)
    .values(parsed)
    .onConflictDoNothing({
      target: [aiJob.tenantId, aiJob.idempotencyKey],
    })
    .returning();

  if (row) {
    return AiJobRecord.parse(row);
  }

  const existing = await getAiJobByIdempotencyKey(db, parsed.tenantId, parsed.idempotencyKey);

  if (!existing) {
    throw new Error(
      'AI job could not be saved because the idempotency conflict could not be resolved.',
    );
  }

  return existing;
};

export const getAiJobByIdempotencyKey = async (
  db: Database,
  tenantId: string,
  idempotencyKey: string,
): Promise<AiJobRecordContract | null> => {
  const [row] = await db
    .select()
    .from(aiJob)
    .where(and(eq(aiJob.tenantId, tenantId), eq(aiJob.idempotencyKey, idempotencyKey)))
    .limit(1);

  return row ? AiJobRecord.parse(row) : null;
};

const getAiJobById = async (db: Database, aiJobId: string): Promise<AiJobRecordContract | null> => {
  const [row] = await db.select().from(aiJob).where(eq(aiJob.id, aiJobId)).limit(1);

  return row ? AiJobRecord.parse(row) : null;
};

export const claimNextQueuedAiJob = async (
  db: Database,
  now: Date,
): Promise<AiJobRecordContract | null> => {
  const [row] = await db.execute(sql`
    UPDATE ${aiJob}
    SET
      status = 'running',
      attempts = attempts + 1,
      updated_at = ${now}
    WHERE id = (
      SELECT id
      FROM ${aiJob}
      WHERE status = 'queued'
      ORDER BY created_at ASC, id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `);

  return row ? parseAiJobRow(row) : null;
};

export const completeAiJob = async (
  db: Database,
  aiJobId: string,
  output: AiJobOutputContract,
  now: Date,
): Promise<AiJobRecordContract> => {
  const currentJob = await getAiJobById(db, aiJobId);

  if (!currentJob) {
    throw new Error('AI job was not found. Refresh the job state and retry.');
  }

  if (currentJob.status !== 'running') {
    throw new Error('AI job cannot be completed unless it is running.');
  }

  const parsedOutput = AiJobOutput.parse(output);
  const [row] = await db
    .update(aiJob)
    .set({
      status: 'succeeded',
      output: parsedOutput,
      lastError: null,
      updatedAt: now,
    })
    .where(and(eq(aiJob.id, aiJobId), eq(aiJob.status, 'running')))
    .returning();

  if (!row) {
    throw new Error('AI job could not be completed because the database returned no row.');
  }

  return AiJobRecord.parse(row);
};

export const failAiJob = async (
  db: Database,
  aiJobId: string,
  reason: string,
  now: Date,
): Promise<AiJobRecordContract> => {
  const currentJob = await getAiJobById(db, aiJobId);

  if (!currentJob) {
    throw new Error('AI job was not found. Refresh the job state and retry.');
  }

  if (currentJob.status !== 'running') {
    throw new Error('AI job cannot fail unless it is running.');
  }

  const nextStatus = currentJob.attempts < currentJob.maxAttempts ? 'queued' : 'failed';
  const [row] = await db
    .update(aiJob)
    .set({
      status: nextStatus,
      lastError: reason,
      updatedAt: now,
    })
    .where(and(eq(aiJob.id, aiJobId), eq(aiJob.status, 'running')))
    .returning();

  if (!row) {
    throw new Error('AI job could not be failed because the database returned no row.');
  }

  return AiJobRecord.parse(row);
};
