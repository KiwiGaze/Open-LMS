import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const scormPackage = pgTable(
  'scorm_package',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    scormVersion: text('scorm_version').notNull(),
    launchUrl: text('launch_url').notNull(),
    manifest: jsonb('manifest').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('scorm_package_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'scorm_package_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    scormVersionCheck: check(
      'scorm_package_scorm_version_check',
      sql`${table.scormVersion} IN ('1.2', '2004')`,
    ),
    statusCheck: check(
      'scorm_package_status_check',
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
    launchUrlHttpsCheck: check(
      'scorm_package_launch_url_https_check',
      sql`lower(${table.launchUrl}) LIKE 'https://%'`,
    ),
  }),
);

export const scormExtractedContent = pgTable(
  'scorm_extracted_content',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    scormPackageId: text('scorm_package_id')
      .notNull()
      .references(() => scormPackage.id, { onDelete: 'cascade' }),
    sourceKey: text('source_key').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    language: text('language').notNull().default('en'),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull().default([]),
    sourceVersion: text('source_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('scorm_extracted_content_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantPackageSourceKeyUnique: uniqueIndex(
      'scorm_extracted_content_tenant_package_source_key_uq',
    ).on(table.tenantId, table.scormPackageId, table.sourceKey),
    tenantCourseForeignKey: foreignKey({
      name: 'scorm_extracted_content_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantPackageForeignKey: foreignKey({
      name: 'scorm_extracted_content_tenant_package_fk',
      columns: [table.tenantId, table.scormPackageId],
      foreignColumns: [scormPackage.tenantId, scormPackage.id],
    }).onDelete('cascade'),
    bodyLengthCheck: check(
      'scorm_extracted_content_body_length_check',
      sql`length(${table.body}) > 0`,
    ),
  }),
);

export const scormAttempt = pgTable(
  'scorm_attempt',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    scormPackageId: text('scorm_package_id')
      .notNull()
      .references(() => scormPackage.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    completionStatus: text('completion_status').notNull(),
    successStatus: text('success_status').notNull(),
    scoreScaled: real('score_scaled'),
    totalTimeSeconds: real('total_time_seconds'),
    suspendData: text('suspend_data'),
    lastVisitedAt: timestamp('last_visited_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('scorm_attempt_tenant_id_uq').on(table.tenantId, table.id),
    tenantPackageStudentUnique: uniqueIndex('scorm_attempt_tenant_package_student_uq').on(
      table.tenantId,
      table.scormPackageId,
      table.studentId,
    ),
    tenantPackageForeignKey: foreignKey({
      name: 'scorm_attempt_tenant_package_fk',
      columns: [table.tenantId, table.scormPackageId],
      foreignColumns: [scormPackage.tenantId, scormPackage.id],
    }).onDelete('cascade'),
    completionStatusCheck: check(
      'scorm_attempt_completion_status_check',
      sql`${table.completionStatus} IN ('not_attempted', 'incomplete', 'completed')`,
    ),
    successStatusCheck: check(
      'scorm_attempt_success_status_check',
      sql`${table.successStatus} IN ('unknown', 'passed', 'failed')`,
    ),
    scoreScaledRangeCheck: check(
      'scorm_attempt_score_scaled_range_check',
      sql`${table.scoreScaled} IS NULL OR (${table.scoreScaled} >= 0 AND ${table.scoreScaled} <= 1)`,
    ),
    totalTimeNonnegativeCheck: check(
      'scorm_attempt_total_time_nonnegative_check',
      sql`${table.totalTimeSeconds} IS NULL OR ${table.totalTimeSeconds} >= 0`,
    ),
  }),
);
