import type { AssignmentPeerReviewStatus, DraftBlock } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { assignment } from './assignment.ts';
import { user } from './auth.ts';
import { course } from './course.ts';
import { fileResource } from './file.ts';
import { courseGroup } from './groups.ts';
import { integrationConnection } from './integration.ts';
import { tenant } from './tenant.ts';

export const draft = pgTable(
  'draft',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    blocks: jsonb('blocks').$type<DraftBlock[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('draft_tenant_id_uq').on(table.tenantId, table.id),
    tenantAssignmentForeignKey: foreignKey({
      name: 'draft_tenant_assignment_fk',
      columns: [table.tenantId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.id],
    }).onDelete('cascade'),
  }),
);

export const submission = pgTable(
  'submission',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    groupId: text('group_id').references(() => courseGroup.id, { onDelete: 'set null' }),
    sourceDraftId: text('source_draft_id')
      .notNull()
      .references(() => draft.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    status: text('status').notNull(),
    contentSnapshot: jsonb('content_snapshot').$type<DraftBlock[]>().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('submission_tenant_id_uq').on(table.tenantId, table.id),
    tenantAssignmentStudentVersionUnique: uniqueIndex(
      'submission_tenant_assignment_student_version_uq',
    ).on(table.tenantId, table.assignmentId, table.studentId, table.version),
    tenantAssignmentGroupVersionUnique: uniqueIndex('submission_tenant_assignment_group_version_uq')
      .on(table.tenantId, table.assignmentId, table.groupId, table.version)
      .where(sql`${table.groupId} IS NOT NULL`),
    tenantAssignmentIdUnique: uniqueIndex('submission_tenant_assignment_id_uq').on(
      table.tenantId,
      table.assignmentId,
      table.id,
    ),
    tenantAssignmentForeignKey: foreignKey({
      name: 'submission_tenant_assignment_fk',
      columns: [table.tenantId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.id],
    }).onDelete('cascade'),
    tenantGroupForeignKey: foreignKey({
      name: 'submission_tenant_group_fk',
      columns: [table.tenantId, table.groupId],
      foreignColumns: [courseGroup.tenantId, courseGroup.id],
    }).onDelete('set null'),
    tenantSourceDraftForeignKey: foreignKey({
      name: 'submission_tenant_source_draft_fk',
      columns: [table.tenantId, table.sourceDraftId],
      foreignColumns: [draft.tenantId, draft.id],
    }).onDelete('restrict'),
  }),
);

export const assignmentPeerReview = pgTable(
  'assignment_peer_review',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').$type<AssignmentPeerReviewStatus>().notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('assignment_peer_review_tenant_id_uq').on(table.tenantId, table.id),
    tenantAssignmentReviewerSubmissionUnique: uniqueIndex(
      'assignment_peer_review_tenant_assignment_reviewer_submission_uq',
    ).on(table.tenantId, table.assignmentId, table.reviewerId, table.submissionId),
    statusCheck: check(
      'assignment_peer_review_status_check',
      sql`${table.status} IN ('assigned', 'submitted', 'completed', 'cancelled')`,
    ),
    tenantAssignmentForeignKey: foreignKey({
      name: 'assignment_peer_review_tenant_assignment_fk',
      columns: [table.tenantId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.id],
    }).onDelete('cascade'),
    tenantSubmissionForeignKey: foreignKey({
      name: 'assignment_peer_review_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantAssignmentSubmissionForeignKey: foreignKey({
      name: 'assignment_peer_review_tenant_assignment_submission_fk',
      columns: [table.tenantId, table.assignmentId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.assignmentId, submission.id],
    }).onDelete('cascade'),
  }),
);

export const submissionAttachment = pgTable(
  'submission_attachment',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    fileResourceId: text('file_resource_id')
      .notNull()
      .references(() => fileResource.id, { onDelete: 'restrict' }),
    displayName: text('display_name').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('submission_attachment_tenant_id_uq').on(table.tenantId, table.id),
    tenantSubmissionPositionUnique: uniqueIndex(
      'submission_attachment_tenant_submission_position_uq',
    ).on(table.tenantId, table.submissionId, table.position),
    positionNonnegativeCheck: check(
      'submission_attachment_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
    displayNameLengthCheck: check(
      'submission_attachment_display_name_length_check',
      sql`length(${table.displayName}) BETWEEN 1 AND 255`,
    ),
    tenantSubmissionForeignKey: foreignKey({
      name: 'submission_attachment_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantFileForeignKey: foreignKey({
      name: 'submission_attachment_tenant_file_fk',
      columns: [table.tenantId, table.fileResourceId],
      foreignColumns: [fileResource.tenantId, fileResource.id],
    }).onDelete('restrict'),
  }),
);

export const submissionComment = pgTable(
  'submission_comment',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    visibility: text('visibility').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('submission_comment_tenant_id_uq').on(table.tenantId, table.id),
    tenantSubmissionCreatedIndex: index('submission_comment_tenant_submission_created_idx').on(
      table.tenantId,
      table.submissionId,
      table.createdAt,
      table.id,
    ),
    bodyLengthCheck: check(
      'submission_comment_body_length_check',
      sql`length(${table.body}) BETWEEN 1 AND 4000`,
    ),
    visibilityCheck: check(
      'submission_comment_visibility_check',
      sql`${table.visibility} IN ('student_visible', 'staff_only', 'peer_reviewer_visible')`,
    ),
    tenantSubmissionForeignKey: foreignKey({
      name: 'submission_comment_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
  }),
);

export const submissionPlagiarismReport = pgTable(
  'submission_plagiarism_report',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    integrationConnectionId: text('integration_connection_id')
      .notNull()
      .references(() => integrationConnection.id, { onDelete: 'cascade' }),
    similarityPercent: real('similarity_percent').notNull(),
    reportUrl: text('report_url'),
    status: text('status').notNull(),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('submission_plagiarism_report_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    perProviderUnique: uniqueIndex('submission_plagiarism_report_per_provider_uq').on(
      table.tenantId,
      table.submissionId,
      table.integrationConnectionId,
    ),
    tenantSubmissionForeignKey: foreignKey({
      name: 'submission_plagiarism_report_tenant_submission_fk',
      columns: [table.tenantId, table.submissionId],
      foreignColumns: [submission.tenantId, submission.id],
    }).onDelete('cascade'),
    tenantConnectionForeignKey: foreignKey({
      name: 'submission_plagiarism_report_tenant_connection_fk',
      columns: [table.tenantId, table.integrationConnectionId],
      foreignColumns: [integrationConnection.tenantId, integrationConnection.id],
    }).onDelete('cascade'),
    statusCheck: check(
      'submission_plagiarism_report_status_check',
      sql`${table.status} IN ('pending', 'complete', 'failed')`,
    ),
    similarityRangeCheck: check(
      'submission_plagiarism_report_similarity_range_check',
      sql`${table.similarityPercent} >= 0 AND ${table.similarityPercent} <= 100`,
    ),
    urlFormatCheck: check(
      'submission_plagiarism_report_url_format_check',
      sql`${table.reportUrl} IS NULL OR lower(${table.reportUrl}) LIKE 'https://%'`,
    ),
  }),
);

export const assignmentPeerReviewResponse = pgTable(
  'assignment_peer_review_response',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    peerReviewId: text('peer_review_id')
      .notNull()
      .references(() => assignmentPeerReview.id, { onDelete: 'cascade' }),
    criterionId: text('criterion_id').notNull(),
    score: real('score'),
    comment: text('comment'),
    status: text('status').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('assignment_peer_review_response_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantPeerReviewCriterionUnique: uniqueIndex(
      'assignment_peer_review_response_tenant_review_criterion_uq',
    ).on(table.tenantId, table.peerReviewId, table.criterionId),
    tenantReviewForeignKey: foreignKey({
      name: 'assignment_peer_review_response_tenant_review_fk',
      columns: [table.tenantId, table.peerReviewId],
      foreignColumns: [assignmentPeerReview.tenantId, assignmentPeerReview.id],
    }).onDelete('cascade'),
    statusCheck: check(
      'assignment_peer_review_response_status_check',
      sql`${table.status} IN ('draft', 'submitted')`,
    ),
    scoreRangeCheck: check(
      'assignment_peer_review_response_score_range_check',
      sql`${table.score} IS NULL OR ${table.score} >= 0`,
    ),
  }),
);
