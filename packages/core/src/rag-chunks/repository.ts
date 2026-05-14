import {
  RagAccessPolicy,
  type RagAccessPolicy as RagAccessPolicyContract,
  RagChunkRecord,
  type RagChunkRecord as RagChunkRecordContract,
  RagVisibility,
  type RagVisibility as RagVisibilityContract,
} from '@openlms/contracts';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../db/client.ts';
import { ragChunk } from '../db/schema/rag-chunk.ts';

export type ListRagChunksForRetrievalInput = {
  tenantId: string;
  courseId: string;
  allowedVisibilities: RagVisibilityContract[];
  allowedAccessPolicies: RagAccessPolicyContract[];
};

const ListRagChunksForRetrievalInputSchema = z
  .object({
    tenantId: z.string().min(1),
    courseId: z.string().min(1),
    allowedVisibilities: z.array(RagVisibility),
    allowedAccessPolicies: z.array(RagAccessPolicy),
  })
  .strict();

export const saveRagChunks = async (
  db: Database,
  values: RagChunkRecordContract[],
): Promise<RagChunkRecordContract[]> => {
  if (values.length === 0) {
    return [];
  }

  const parsed = values.map((value) => RagChunkRecord.parse(value));
  const rows = await db
    .insert(ragChunk)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        ragChunk.tenantId,
        ragChunk.sourceType,
        ragChunk.sourceId,
        ragChunk.sourceVersion,
        ragChunk.chunkIndex,
      ],
      set: {
        moduleId: sql`excluded.module_id`,
        unitId: sql`excluded.unit_id`,
        sourceTitle: sql`excluded.source_title`,
        content: sql`excluded.content`,
        visibility: sql`excluded.visibility`,
        language: sql`excluded.language`,
        accessPolicy: sql`excluded.access_policy`,
        learningObjectiveIds: sql`excluded.learning_objective_ids`,
        embedding: sql`excluded.embedding`,
        embeddingModel: sql`excluded.embedding_model`,
        embeddingModelVersion: sql`excluded.embedding_model_version`,
        chunkingStrategyVersion: sql`excluded.chunking_strategy_version`,
        sourceUpdatedAt: sql`excluded.source_updated_at`,
        indexedAt: sql`excluded.indexed_at`,
      },
    })
    .returning();

  return rows.map((row) => RagChunkRecord.parse(row));
};

export const listRagChunksForRetrieval = async (
  db: Database,
  input: ListRagChunksForRetrievalInput,
): Promise<RagChunkRecordContract[]> => {
  const parsed = ListRagChunksForRetrievalInputSchema.parse(input);

  if (parsed.allowedVisibilities.length === 0 || parsed.allowedAccessPolicies.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(ragChunk)
    .where(
      and(
        eq(ragChunk.tenantId, parsed.tenantId),
        eq(ragChunk.courseId, parsed.courseId),
        inArray(ragChunk.visibility, parsed.allowedVisibilities),
        inArray(ragChunk.accessPolicy, parsed.allowedAccessPolicies),
      ),
    )
    .orderBy(ragChunk.sourceType);

  return rows.map((row) => RagChunkRecord.parse(row));
};
