import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core/columns/vector_extension/vector';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const ragChunk = pgTable(
  'rag_chunk',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id'),
    unitId: text('unit_id'),
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    sourceTitle: text('source_title').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    visibility: text('visibility').notNull(),
    sourceVersion: text('source_version').notNull(),
    language: text('language').notNull(),
    accessPolicy: text('access_policy').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull(),
    embedding: vector('embedding', { dimensions: 8 }).$type<number[]>().notNull(),
    embeddingModel: text('embedding_model').notNull(),
    embeddingModelVersion: text('embedding_model_version').notNull(),
    chunkingStrategyVersion: text('chunking_strategy_version').notNull(),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }).notNull(),
    indexedAt: timestamp('indexed_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    sourceChunkUnique: uniqueIndex('rag_chunk_source_chunk_uq').on(
      table.tenantId,
      table.sourceType,
      table.sourceId,
      table.sourceVersion,
      table.chunkIndex,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'rag_chunk_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);
