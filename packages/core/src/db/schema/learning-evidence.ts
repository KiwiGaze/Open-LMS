import type { LearningEvidenceContext, LearningEvidenceProvenance } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, learningObjective } from './course.ts';
import { tenant } from './tenant.ts';

export const learningEvidence = pgTable(
  'learning_evidence',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    objectiveId: text('objective_id')
      .notNull()
      .references(() => learningObjective.id, { onDelete: 'cascade' }),
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    sourceAttempt: integer('source_attempt'),
    sourceObservedAt: timestamp('source_observed_at', { withTimezone: true }).notNull(),
    signal: text('signal').notNull(),
    score: real('score'),
    maxScore: real('max_score'),
    confidence: real('confidence').notNull(),
    misconceptionIds: jsonb('misconception_ids').$type<string[]>().notNull().default([]),
    evidenceText: text('evidence_text').notNull(),
    provenance: jsonb('provenance').$type<LearningEvidenceProvenance>().notNull(),
    context: jsonb('context').$type<LearningEvidenceContext>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('learning_evidence_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'learning_evidence_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantCourseObjectiveForeignKey: foreignKey({
      name: 'learning_evidence_tenant_course_objective_fk',
      columns: [table.tenantId, table.courseId, table.objectiveId],
      foreignColumns: [
        learningObjective.tenantId,
        learningObjective.courseId,
        learningObjective.id,
      ],
    }).onDelete('cascade'),
    sourceTypeCheck: check(
      'learning_evidence_source_type_check',
      sql`${table.sourceType} IN ('assignment_submission', 'quiz_attempt', 'discussion_post', 'support_conversation', 'instructor_observation')`,
    ),
    signalCheck: check(
      'learning_evidence_signal_check',
      sql`${table.signal} IN ('attempt', 'revision', 'misconception', 'explanation', 'mastery_observation')`,
    ),
    confidenceRangeCheck: check(
      'learning_evidence_confidence_range_check',
      sql`${table.confidence} >= 0 AND ${table.confidence} <= 1`,
    ),
    scorePairCheck: check(
      'learning_evidence_score_pair_check',
      sql`((${table.score} IS NULL AND ${table.maxScore} IS NULL) OR (${table.score} IS NOT NULL AND ${table.maxScore} IS NOT NULL))`,
    ),
    scoreBoundsCheck: check(
      'learning_evidence_score_bounds_check',
      sql`${table.score} IS NULL OR (${table.score} >= 0 AND ${table.maxScore} > 0 AND ${table.score} <= ${table.maxScore})`,
    ),
    sourceAttemptPositiveCheck: check(
      'learning_evidence_source_attempt_positive_check',
      sql`${table.sourceAttempt} IS NULL OR ${table.sourceAttempt} > 0`,
    ),
    misconceptionIdsArrayCheck: check(
      'learning_evidence_misconception_ids_array_check',
      sql`jsonb_typeof(${table.misconceptionIds}) = 'array'`,
    ),
  }),
);
