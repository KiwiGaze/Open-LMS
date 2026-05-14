import type { RubricCriterion } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenant } from './tenant.ts';

export const rubricTemplate = pgTable('rubric_template', {
  id: text('id').primaryKey(),
  version: integer('version').notNull(),
  owner: text('owner').notNull(),
  title: text('title').notNull(),
  disciplineTags: jsonb('discipline_tags').$type<string[]>().notNull(),
  assignmentTypeTags: jsonb('assignment_type_tags').$type<string[]>().notNull(),
  localeTags: jsonb('locale_tags').$type<string[]>().notNull(),
  criteria: jsonb('criteria').$type<RubricCriterion[]>().notNull(),
  qualityScore: real('quality_score').notNull(),
  exampleFeedbackFragments: jsonb('example_feedback_fragments').$type<string[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const rubric = pgTable(
  'rubric',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    version: integer('version').notNull(),
    sourceTemplateId: text('source_template_id').references(() => rubricTemplate.id, {
      onDelete: 'set null',
    }),
    criteria: jsonb('criteria').$type<RubricCriterion[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('rubric_tenant_id_uq').on(table.tenantId, table.id),
  }),
);
