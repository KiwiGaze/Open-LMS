import { AiJobRecord, RagChunkRecord } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  claimNextQueuedAiJob,
  completeAiJob,
  failAiJob,
  getAiJobByIdempotencyKey,
  saveAiJob,
} from '../src/ai-jobs/repository.ts';
import type { Database } from '../src/db/client.ts';
import { listRagChunksForRetrieval, saveRagChunks } from '../src/rag-chunks/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE30';

const job = AiJobRecord.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  tenantId,
  actionIdentifier: 'feedback_draft',
  contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  idempotencyKey: 'feedback-draft-job-1',
  status: 'queued',
  attempts: 0,
  maxAttempts: 2,
  output: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
});

const jobOutput = {
  text: 'Generated feedback',
  inputTokens: 10,
  outputTokens: 15,
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE31',
  providerType: 'openai_compatible',
  model: 'feedback-model',
  estimatedCostCents: 0.018,
};

const ragChunk = RagChunkRecord.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  courseId,
  moduleId: '01J9QW7B6N5W2YH3D3A1V0KE30',
  unitId: '01J9QW7B6N5W2YH3D3A1V0KE31',
  sourceType: 'course_page',
  sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  sourceTitle: 'Evidence overview',
  chunkIndex: 0,
  content: 'Evidence explanation connects a quote to the claim.',
  visibility: 'student_visible',
  sourceVersion: '3',
  language: 'en-US',
  accessPolicy: 'course_member',
  learningObjectiveIds: [learningObjectiveId],
  embedding: [0.14, 0.22, 0.08, 0.41, 0.37, 0.19, 0.02, 0.11],
  embeddingModel: 'lexical-dev',
  embeddingModelVersion: '2026-05-10',
  chunkingStrategyVersion: 'paragraph-v1',
  sourceUpdatedAt: now,
  indexedAt: now,
});

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T | T[]) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            const inserted = Array.isArray(value) ? value : [value];
            rows.push(...inserted);
            return inserted;
          },
        }),
        onConflictDoUpdate: () => ({
          returning: async () => {
            const inserted = Array.isArray(value) ? value : [value];
            rows.push(...inserted);
            return inserted;
          },
        }),
        returning: async () => {
          const inserted = Array.isArray(value) ? value : [value];
          rows.push(...inserted);
          return inserted;
        },
      }),
    }),
  }) as unknown as Database;

const createAiJobIdempotencyDb = (rows: AiJobRecord[]): Database =>
  ({
    insert: () => ({
      values: (value: AiJobRecord) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            const existing = rows.find(
              (row) =>
                row.tenantId === value.tenantId && row.idempotencyKey === value.idempotencyKey,
            );

            if (existing) {
              return [];
            }

            rows.push(value);
            return [value];
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
          orderBy: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createUnexpectedSelectDb = (): Database =>
  ({
    select: () => {
      throw new Error('RAG retrieval should validate filters before querying.');
    },
  }) as unknown as Database;

const createTransitionDb = <T>(rows: T[]): Database =>
  ({
    execute: async () => {
      const queuedIndex = rows.findIndex((row) => (row as { status?: string }).status === 'queued');

      if (queuedIndex === -1) {
        return [];
      }

      const row = rows[queuedIndex] as T & { attempts: number };
      const updated = {
        ...row,
        status: 'running',
        attempts: row.attempts + 1,
        updatedAt: now,
      };

      rows[queuedIndex] = updated as T;
      return [updated];
    },
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
    update: () => ({
      set: (patch: Partial<T>) => ({
        where: () => ({
          returning: async () => {
            const [row] = rows;
            if (!row) {
              return [];
            }

            const updated = { ...row, ...patch };
            rows[0] = updated as T;
            return [updated];
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createAtomicAiJobClaimDb = (claimedJob: AiJobRecord): Database =>
  ({
    select: () => {
      throw new Error('AI job claiming must not preselect a stale queued row.');
    },
    execute: async () => [claimedJob],
  }) as unknown as Database;

describe('AI operational storage', () => {
  it('stores and finds AI jobs by tenant idempotency key', async () => {
    const saved = await saveAiJob(createInsertOnlyDb([]), job);
    const found = await getAiJobByIdempotencyKey(
      createSelectOnlyDb([job]),
      tenantId,
      'feedback-draft-job-1',
    );

    expect(saved).toEqual(job);
    expect(found).toEqual(job);
  });

  it('returns an existing AI job on idempotency replay without overwriting state', async () => {
    const completedJob = AiJobRecord.parse({
      ...job,
      status: 'succeeded',
      attempts: 1,
      output: jobOutput,
      updatedAt: new Date('2026-05-10T00:05:00.000Z'),
    });
    const rows = [completedJob];
    const replay = AiJobRecord.parse({
      ...job,
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      status: 'queued',
      attempts: 0,
      output: null,
      lastError: 'reset attempt',
      updatedAt: new Date('2026-05-10T00:10:00.000Z'),
    });

    const saved = await saveAiJob(createAiJobIdempotencyDb(rows), replay);

    expect(saved).toEqual(completedJob);
    expect(rows).toEqual([completedJob]);
  });

  it('claims the next queued AI job for durable worker execution', async () => {
    const rows = [job];
    const claimed = await claimNextQueuedAiJob(createTransitionDb(rows), now);

    expect(claimed).toEqual({
      ...job,
      status: 'running',
      attempts: 1,
      updatedAt: now,
    });
    expect(rows[0]?.status).toBe('running');
  });

  it('claims queued AI jobs with one atomic database statement', async () => {
    const claimedJob = AiJobRecord.parse({
      ...job,
      status: 'running',
      attempts: 1,
      updatedAt: now,
    });

    const claimed = await claimNextQueuedAiJob(createAtomicAiJobClaimDb(claimedJob), now);

    expect(claimed).toEqual(claimedJob);
  });

  it('completes a running AI job with generation output', async () => {
    const rows = [{ ...job, status: 'running' as const, attempts: 1, updatedAt: now }];

    const completed = await completeAiJob(createTransitionDb(rows), job.id, jobOutput, now);

    expect(completed).toEqual({
      ...job,
      status: 'succeeded',
      attempts: 1,
      output: jobOutput,
      lastError: null,
      updatedAt: now,
    });
    expect(completed.output?.model).toBe('feedback-model');
  });

  it('rejects empty durable AI job completion output', async () => {
    const rows = [{ ...job, status: 'running' as const, attempts: 1, updatedAt: now }];

    await expect(
      completeAiJob(createTransitionDb(rows), job.id, { ...jobOutput, text: '' }, now),
    ).rejects.toThrow();
  });

  it('requeues or fails running AI jobs based on max attempts', async () => {
    const retriableRows = [{ ...job, status: 'running' as const, attempts: 1, updatedAt: now }];
    const exhaustedRows = [
      { ...job, status: 'running' as const, attempts: 2, maxAttempts: 2, updatedAt: now },
    ];

    const retried = await failAiJob(
      createTransitionDb(retriableRows),
      job.id,
      'Provider timeout',
      now,
    );
    const failed = await failAiJob(
      createTransitionDb(exhaustedRows),
      job.id,
      'Provider timeout',
      now,
    );

    expect(retried.status).toBe('queued');
    expect(retried.lastError).toBe('Provider timeout');
    expect(failed.status).toBe('failed');
    expect(failed.lastError).toBe('Provider timeout');
  });

  it('stores RAG chunks and filters retrieval by tenant, course, and visibility', async () => {
    const savedRows: RagChunkRecord[] = [];
    const saved = await saveRagChunks(createInsertOnlyDb(savedRows), [ragChunk]);
    const listed = await listRagChunksForRetrieval(createSelectOnlyDb([ragChunk]), {
      tenantId,
      courseId,
      allowedVisibilities: ['student_visible'],
      allowedAccessPolicies: ['course_member'],
    });

    expect(saved).toEqual([ragChunk]);
    expect(savedRows).toEqual([ragChunk]);
    expect(listed).toEqual([ragChunk]);
  });

  it('rejects invalid RAG retrieval filters before querying', async () => {
    await expect(
      listRagChunksForRetrieval(createUnexpectedSelectDb(), {
        tenantId,
        courseId,
        allowedVisibilities: ['private'] as never,
        allowedAccessPolicies: ['course_member'],
      }),
    ).rejects.toThrow(/invalid enum/i);
  });
});
