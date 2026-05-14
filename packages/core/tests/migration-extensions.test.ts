import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import initSqlJs from 'sql.js';
import { describe, expect, it } from 'vitest';

const migrationsDirectory = join(import.meta.dirname, '..', 'drizzle');
const extensionManifestPath = join(import.meta.dirname, '..', 'src', 'db', 'extensions.sql');

const readMigrationSql = (): string =>
  readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => readFileSync(join(migrationsDirectory, fileName), 'utf8'))
    .join('\n');

const readMigrationFile = (fileName: string): string =>
  readFileSync(join(migrationsDirectory, fileName), 'utf8');

const readMigrationSnapshot = (fileName: string): string =>
  readFileSync(join(migrationsDirectory, 'meta', fileName), 'utf8');

const legacyAiGenerationLogRelinkSql = (): string => {
  const migrationSql = readMigrationFile('0020_powerful_carmella_unuscione.sql');
  const insertStart = migrationSql.indexOf('INSERT INTO "ai_generation_log"');
  const updateEnd = migrationSql.indexOf(
    'WHERE "ai_generation_log_id" = \'legacy-untracked\';--> statement-breakpoint',
  );

  if (insertStart === -1 || updateEnd === -1) {
    throw new Error('Legacy AI generation log relink SQL was not found in migration 0020.');
  }

  return migrationSql
    .slice(insertStart, updateEnd + 'WHERE "ai_generation_log_id" = \'legacy-untracked\';'.length)
    .replaceAll('--> statement-breakpoint', '');
};

const listRequiredExtensions = (): string[] =>
  Array.from(
    readFileSync(extensionManifestPath, 'utf8').matchAll(
      /CREATE EXTENSION IF NOT EXISTS "([^"]+)"/g,
    ),
    (match) => match[1] ?? '',
  ).filter((extensionName) => extensionName.length > 0);

const countRows = (
  db: initSqlJs.Database,
  sql: string,
  bindParams: initSqlJs.BindParams = [],
): number => {
  const result = db.exec(sql, bindParams)[0];
  const count = result?.values[0]?.[0];

  if (typeof count !== 'number') {
    throw new Error('SQLite count query did not return a numeric count.');
  }

  return count;
};

describe('database extension migrations', () => {
  it('installs every extension declared by the database extension manifest', () => {
    const migrationSql = readMigrationSql();

    for (const extensionName of listRequiredExtensions()) {
      expect(migrationSql).toContain(`CREATE EXTENSION IF NOT EXISTS "${extensionName}"`);
    }
  });
});

describe('data-preserving migration constraints', () => {
  it('adds nullable course soft-delete metadata without removing course rows', () => {
    const migrationSql = readMigrationFile('0118_course_soft_delete.sql');

    expect(migrationSql).toContain('ALTER TABLE "course" ADD COLUMN "deleted_at"');
    expect(migrationSql).toContain("\"status\" IN ('draft', 'active', 'archived', 'deleted')");
    expect(migrationSql).not.toContain('DELETE FROM "course"');
  });

  it('adds calendar reminder storage and notification preference support', () => {
    const migrationSql = readMigrationFile('0119_course_calendar_reminders.sql');

    expect(migrationSql).toContain('CREATE TABLE "course_calendar_event_reminder"');
    expect(migrationSql).toContain('course_calendar_event_tenant_course_id_uq');
    expect(migrationSql).toContain('course_calendar_event_reminder_tenant_course_event_fk');
    expect(migrationSql).toContain('course_calendar_event_reminder_pending_uq');
    expect(migrationSql).toContain("'calendar_reminder'");
    expect(migrationSql).not.toContain('DELETE FROM "course_calendar_event"');
  });

  it('adds notification digest delivery storage without deleting notifications', () => {
    const migrationSql = readMigrationFile('0120_notification_digest_delivery.sql');

    expect(migrationSql).toContain('CREATE TABLE "notification_digest_delivery"');
    expect(migrationSql).toContain('notification_tenant_recipient_id_uq');
    expect(migrationSql).toContain('notification_digest_delivery_notification_fk');
    expect(migrationSql).toContain('notification_digest_delivery_recipient_notification_fk');
    expect(migrationSql).toContain('notification_digest_delivery_once_uq');
    expect(migrationSql).toContain('"channel" IN (\'email\')');
    expect(migrationSql).toContain("\"frequency\" IN ('daily_digest', 'weekly_digest')");
    expect(migrationSql).not.toContain('DELETE FROM "notification"');
  });

  it('extends grade status checks to support incomplete grades without deleting grade rows', () => {
    const migrationSql = readMigrationFile('0121_incomplete_grade_status.sql');

    expect(migrationSql).toContain('DROP CONSTRAINT "grade_history_status_check"');
    expect(migrationSql).toContain('DROP CONSTRAINT "grade_history_previous_status_check"');
    expect(migrationSql).toContain('DROP CONSTRAINT "gradebook_manual_grade_status_check"');
    expect(migrationSql).toContain("'incomplete'");
    expect(migrationSql).not.toContain('DELETE FROM "grade"');
    expect(migrationSql).not.toContain('DELETE FROM "grade_history"');
    expect(migrationSql).not.toContain('DELETE FROM "gradebook_manual_grade"');
  });

  it('extends submission comment visibility checks for peer reviewer scoped comments', () => {
    const migrationSql = readMigrationFile('0122_peer_reviewer_submission_comments.sql');

    expect(migrationSql).toContain('DROP CONSTRAINT "submission_comment_visibility_check"');
    expect(migrationSql).toContain('ADD CONSTRAINT "submission_comment_visibility_check"');
    expect(migrationSql).toContain("'peer_reviewer_visible'");
    expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\b/i);
  });

  it('adds quiz access controls without deleting quiz rows', () => {
    const migrationSql = readMigrationFile('0123_quiz_access_controls.sql');

    expect(migrationSql).toContain('ALTER TABLE "quiz" ADD COLUMN "access_password_hash" text');
    expect(migrationSql).toContain('ALTER TABLE "quiz" ADD COLUMN "allowed_ip_ranges" jsonb');
    expect(migrationSql).toContain('quiz_allowed_ip_ranges_array_check');
    expect(migrationSql).toContain('quiz_access_password_hash_length_check');
    expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\b/i);
  });

  it('adds assignment attachment constraints without deleting assignment rows', () => {
    const migrationSql = readMigrationFile('0124_assignment_attachment_constraints.sql');

    expect(migrationSql).toContain(
      'ALTER TABLE "assignment" ADD COLUMN "allowed_file_extensions" jsonb',
    );
    expect(migrationSql).toContain('ALTER TABLE "assignment" ADD COLUMN "max_file_size_bytes"');
    expect(migrationSql).toContain('assignment_allowed_file_extensions_array_check');
    expect(migrationSql).toContain('assignment_max_file_size_bytes_positive_check');
    expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\b/i);
  });

  it('adds append-only learning evidence ledger storage without deleting mastery or grade rows', () => {
    const migrationSql = readMigrationFile('0129_learning_evidence_ledger.sql');

    expect(migrationSql).toContain('CREATE TABLE "learning_evidence"');
    expect(migrationSql).toContain('"source_type" text NOT NULL');
    expect(migrationSql).toContain('"provenance" jsonb NOT NULL');
    expect(migrationSql).toContain('"context" jsonb NOT NULL');
    expect(migrationSql).toContain('learning_evidence_tenant_course_objective_fk');
    expect(migrationSql).toContain('learning_evidence_confidence_range_check');
    expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migrationSql).not.toContain('UPDATE "learning_objective_mastery"');
    expect(migrationSql).not.toContain('UPDATE "grade"');
  });

  it('relinks legacy AI feedback drafts before adding the tenant AI generation log foreign key', () => {
    const migrationSql = readMigrationSql();
    const relinkIndex = migrationSql.indexOf('UPDATE "ai_feedback_draft"');
    const foreignKeyIndex = migrationSql.indexOf(
      'ADD CONSTRAINT "ai_feedback_draft_tenant_ai_generation_log_fk"',
    );

    expect(relinkIndex).toBeGreaterThan(-1);
    expect(foreignKeyIndex).toBeGreaterThan(-1);
    expect(relinkIndex).toBeLessThan(foreignKeyIndex);
  });

  it('relinks multi-tenant legacy AI feedback drafts to draft-specific generation logs', () => {
    const migrationSql = readMigrationFile('0020_powerful_carmella_unuscione.sql');

    expect(migrationSql).toContain('SELECT\n  "id",');
    expect(migrationSql).toContain('ON CONFLICT ("id") DO NOTHING');
    expect(migrationSql).toContain('SET "ai_generation_log_id" = "id"');
    expect(migrationSql).not.toContain(
      'SET "ai_generation_log_id" = \'01J9QW7B6N5W2YH3D3A1V0KE34\'',
    );
  });

  it('runs the legacy AI feedback draft relink against multi-tenant legacy data', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const sql = `
      CREATE TABLE "ai_generation_log" (
        "id" text PRIMARY KEY NOT NULL,
        "tenant_id" text NOT NULL,
        "actor_id" text,
        "action_identifier" text NOT NULL,
        "context_package_id" text NOT NULL,
        "prompt_identifier" text NOT NULL,
        "prompt_version" text NOT NULL,
        "provider_type" text NOT NULL,
        "model" text NOT NULL,
        "input_tokens" integer NOT NULL,
        "output_tokens" integer NOT NULL,
        "duration_ms" integer NOT NULL,
        "retry_count" integer NOT NULL,
        "fallback_used" integer NOT NULL
      );
      CREATE UNIQUE INDEX "ai_generation_log_tenant_id_uq" ON "ai_generation_log" ("tenant_id","id");
      CREATE TABLE "ai_feedback_draft" (
        "id" text PRIMARY KEY NOT NULL,
        "tenant_id" text NOT NULL,
        "context_package_id" text NOT NULL,
        "prompt_identifier" text NOT NULL,
        "prompt_version" text NOT NULL,
        "provider_type" text NOT NULL,
        "model" text NOT NULL,
        "ai_generation_log_id" text NOT NULL
      );
      INSERT INTO "ai_feedback_draft" VALUES
        ('01J9QW7B6N5W2YH3D3A1V0KE35','01J9QW7B6N5W2YH3D3A1V0KE2T','01J9QW7B6N5W2YH3D3A1V0KE36','feedback_draft.default','2026-05-10.1','openai_compatible','feedback-model','legacy-untracked'),
        ('01J9QW7B6N5W2YH3D3A1V0KE37','01J9QW7B6N5W2YH3D3A1V0KE2V','01J9QW7B6N5W2YH3D3A1V0KE38','feedback_draft.default','2026-05-10.1','openai_compatible','feedback-model','legacy-untracked');
      ${legacyAiGenerationLogRelinkSql()}
      SELECT COUNT(*) FROM "ai_generation_log";
      SELECT COUNT(DISTINCT "ai_generation_log_id") FROM "ai_feedback_draft";
      SELECT COUNT(*) FROM "ai_feedback_draft" AS "draft"
        INNER JOIN "ai_generation_log" AS "log"
          ON "log"."tenant_id" = "draft"."tenant_id"
          AND "log"."id" = "draft"."ai_generation_log_id";
      SELECT COUNT(*) FROM "ai_feedback_draft" WHERE "ai_generation_log_id" = 'legacy-untracked';
    `;

    try {
      db.run(sql);

      expect(countRows(db, 'SELECT COUNT(*) FROM "ai_generation_log"')).toBe(2);
      expect(
        countRows(db, 'SELECT COUNT(DISTINCT "ai_generation_log_id") FROM "ai_feedback_draft"'),
      ).toBe(2);
      expect(
        countRows(
          db,
          `SELECT COUNT(*) FROM "ai_feedback_draft" AS "draft"
              INNER JOIN "ai_generation_log" AS "log"
                ON "log"."tenant_id" = "draft"."tenant_id"
                AND "log"."id" = "draft"."ai_generation_log_id"`,
        ),
      ).toBe(2);
      expect(
        countRows(db, 'SELECT COUNT(*) FROM "ai_feedback_draft" WHERE "ai_generation_log_id" = ?', [
          'legacy-untracked',
        ]),
      ).toBe(0);
    } finally {
      db.close();
    }
  });

  it('enforces one official grade per tenant-scoped submission', () => {
    const migrationSql = readMigrationSql();

    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "grade_tenant_submission_uq" ON "grade" USING btree ("tenant_id","submission_id")',
    );
  });

  it('constrains linked published-feedback grades to the same submission', () => {
    const migrationSql = readMigrationSql();

    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "grade_tenant_id_submission_uq" ON "grade" USING btree ("tenant_id","id","submission_id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "published_feedback_tenant_linked_grade_submission_fk" FOREIGN KEY ("tenant_id","linked_grade_id","submission_id") REFERENCES "public"."grade"("tenant_id","id","submission_id") ON DELETE SET NULL ("linked_grade_id") ON UPDATE no action',
    );
  });

  it('constrains assignment peer reviews to submissions from the same assignment', () => {
    const migrationSql = readMigrationFile('0046_old_shatterstar.sql');
    const submissionAssignmentIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "submission_tenant_assignment_id_uq"',
    );
    const assignmentSubmissionForeignKey = migrationSql.indexOf(
      'ADD CONSTRAINT "assignment_peer_review_tenant_assignment_submission_fk"',
    );

    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "submission_tenant_assignment_id_uq" ON "submission" USING btree ("tenant_id","assignment_id","id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_peer_review_tenant_assignment_submission_fk" FOREIGN KEY ("tenant_id","assignment_id","submission_id") REFERENCES "public"."submission"("tenant_id","assignment_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(submissionAssignmentIndex).toBeGreaterThan(-1);
    expect(assignmentSubmissionForeignKey).toBeGreaterThan(-1);
    expect(submissionAssignmentIndex).toBeLessThan(assignmentSubmissionForeignKey);
  });

  it('constrains course external tools to tenant-scoped courses and integration connections', () => {
    const migrationSql = readMigrationFile('0047_bizarre_trauma.sql');
    const connectionIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "integration_connection_tenant_id_uq"',
    );
    const connectionForeignKey = migrationSql.indexOf(
      'ADD CONSTRAINT "course_external_tool_tenant_connection_fk"',
    );

    expect(migrationSql).toContain('CREATE TABLE "course_external_tool"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "integration_connection_tenant_id_uq" ON "integration_connection" USING btree ("tenant_id","id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_external_tool_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_external_tool_tenant_connection_fk" FOREIGN KEY ("tenant_id","integration_connection_id") REFERENCES "public"."integration_connection"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "course_external_tool_description_length_check" CHECK',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "course_external_tool_launch_url_https_check" CHECK',
    );
    expect(connectionIndex).toBeGreaterThan(-1);
    expect(connectionForeignKey).toBeGreaterThan(-1);
    expect(connectionIndex).toBeLessThan(connectionForeignKey);
  });

  it('adds one-time LTI deep linking sessions for return replay protection', () => {
    const migrationSql = readMigrationFile('0107_lti_deep_linking_sessions.sql');

    expect(migrationSql).toContain('CREATE TABLE "lti_1p3_deep_linking_session"');
    expect(migrationSql).toContain('CONSTRAINT "lti_1p3_deep_linking_session_tenant_tool_fk"');
    expect(migrationSql).toContain('CONSTRAINT "lti_1p3_deep_linking_session_status_check"');
    expect(migrationSql).toContain('CREATE INDEX "lti_1p3_deep_linking_session_pending_idx"');
  });

  it('constrains learning objective mastery to tenant-scoped course objectives', () => {
    const migrationSql = readMigrationFile('0048_learning_objective_mastery.sql');
    const objectiveIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "learning_objective_tenant_course_id_uq"',
    );
    const objectiveForeignKey = migrationSql.indexOf(
      'ADD CONSTRAINT "learning_objective_mastery_tenant_course_objective_fk"',
    );

    expect(migrationSql).toContain('CREATE TABLE "learning_objective_mastery"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "learning_objective_tenant_course_id_uq" ON "learning_objective" USING btree ("tenant_id","course_id","id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "learning_objective_mastery_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "learning_objective_mastery_tenant_course_objective_fk" FOREIGN KEY ("tenant_id","course_id","learning_objective_id") REFERENCES "public"."learning_objective"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "learning_objective_mastery_tenant_course_objective_student_uq" ON "learning_objective_mastery" USING btree ("tenant_id","course_id","learning_objective_id","student_id")',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "learning_objective_mastery_score_pair_check" CHECK',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "learning_objective_mastery_score_bounds_check" CHECK',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "learning_objective_mastery_score_finite_check" CHECK',
    );
    expect(migrationSql).toContain(
      "\"learning_objective_mastery\".\"score\"::text NOT IN ('NaN', 'Infinity', '-Infinity')",
    );
    expect(migrationSql).toContain(
      "\"learning_objective_mastery\".\"max_score\"::text NOT IN ('NaN', 'Infinity', '-Infinity')",
    );
    expect(objectiveIndex).toBeGreaterThan(-1);
    expect(objectiveForeignKey).toBeGreaterThan(-1);
    expect(objectiveIndex).toBeLessThan(objectiveForeignKey);
  });

  it('constrains assignment gradebook categories to tenant-scoped course assignments', () => {
    const migrationSql = readMigrationFile('0049_assignment_gradebook_categories.sql');
    const assignmentIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "assignment_tenant_course_id_uq"',
    );
    const categoryIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "gradebook_category_tenant_course_id_uq"',
    );
    const assignmentForeignKey = migrationSql.indexOf(
      'ADD CONSTRAINT "assignment_gradebook_category_tenant_course_assignment_fk"',
    );
    const categoryForeignKey = migrationSql.indexOf(
      'ADD CONSTRAINT "assignment_gradebook_category_tenant_course_category_fk"',
    );

    expect(migrationSql).toContain('CREATE TABLE "assignment_gradebook_category"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "assignment_tenant_course_id_uq" ON "assignment" USING btree ("tenant_id","course_id","id")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "gradebook_category_tenant_course_id_uq" ON "gradebook_category" USING btree ("tenant_id","course_id","id")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "assignment_gradebook_category_tenant_assignment_uq" ON "assignment_gradebook_category" USING btree ("tenant_id","assignment_id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_gradebook_category_tenant_course_assignment_fk" FOREIGN KEY ("tenant_id","course_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_gradebook_category_tenant_course_category_fk" FOREIGN KEY ("tenant_id","course_id","gradebook_category_id") REFERENCES "public"."gradebook_category"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(assignmentIndex).toBeGreaterThan(-1);
    expect(categoryIndex).toBeGreaterThan(-1);
    expect(assignmentForeignKey).toBeGreaterThan(-1);
    expect(categoryForeignKey).toBeGreaterThan(-1);
    expect(assignmentIndex).toBeLessThan(assignmentForeignKey);
    expect(categoryIndex).toBeLessThan(categoryForeignKey);
  });

  it('rejects duplicate and cross-course assignment gradebook category bindings', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "tenant" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "course" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          UNIQUE ("tenant_id", "id"),
          FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade
        );
        CREATE TABLE "assignment" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id"),
          FOREIGN KEY ("tenant_id", "course_id") REFERENCES "course"("tenant_id", "id") ON DELETE cascade
        );
        CREATE TABLE "gradebook_category" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id"),
          FOREIGN KEY ("tenant_id", "course_id") REFERENCES "course"("tenant_id", "id") ON DELETE cascade
        );
        CREATE TABLE "assignment_gradebook_category" (
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "assignment_id" text NOT NULL,
          "gradebook_category_id" text NOT NULL,
          UNIQUE ("tenant_id", "assignment_id"),
          FOREIGN KEY ("tenant_id", "course_id", "assignment_id")
            REFERENCES "assignment"("tenant_id", "course_id", "id") ON DELETE cascade,
          FOREIGN KEY ("tenant_id", "course_id", "gradebook_category_id")
            REFERENCES "gradebook_category"("tenant_id", "course_id", "id") ON DELETE cascade
        );

        INSERT INTO "tenant" VALUES ('tenant-a');
        INSERT INTO "course" VALUES ('course-a', 'tenant-a'), ('course-b', 'tenant-a');
        INSERT INTO "assignment" VALUES
          ('assignment-a', 'tenant-a', 'course-a'),
          ('assignment-b', 'tenant-a', 'course-a');
        INSERT INTO "gradebook_category" VALUES
          ('category-a', 'tenant-a', 'course-a'),
          ('category-b', 'tenant-a', 'course-b');
        INSERT INTO "assignment_gradebook_category" VALUES
          ('tenant-a', 'course-a', 'assignment-a', 'category-a');
      `);

      expect(() =>
        db.run(`
          INSERT INTO "assignment_gradebook_category" VALUES
            ('tenant-a', 'course-b', 'assignment-b', 'category-b');
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "assignment_gradebook_category" VALUES
            ('tenant-a', 'course-a', 'assignment-a', 'category-a');
        `),
      ).toThrow();
      expect(countRows(db, 'SELECT COUNT(*) FROM "assignment_gradebook_category"')).toBe(1);
    } finally {
      db.close();
    }
  });

  it('constrains manual gradebook items and grades to tenant-scoped course data', () => {
    const migrationSql = readMigrationFile('0050_gradebook_manual_items.sql');
    const allMigrationSql = readMigrationSql();
    const categoryIndex = allMigrationSql.indexOf(
      'CREATE UNIQUE INDEX "gradebook_category_tenant_course_id_uq"',
    );
    const manualItemIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "gradebook_manual_item_tenant_id_uq"',
    );
    const categoryForeignKey = allMigrationSql.indexOf(
      'ADD CONSTRAINT "gradebook_manual_item_tenant_course_category_fk"',
    );
    const gradeForeignKey = migrationSql.indexOf(
      'ADD CONSTRAINT "gradebook_manual_grade_tenant_item_fk"',
    );

    expect(migrationSql).toContain('CREATE TABLE "gradebook_manual_item"');
    expect(migrationSql).toContain('CREATE TABLE "gradebook_manual_grade"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "gradebook_manual_item_tenant_course_position_uq" ON "gradebook_manual_item" USING btree ("tenant_id","course_id","position")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "gradebook_manual_grade_tenant_item_student_uq" ON "gradebook_manual_grade" USING btree ("tenant_id","gradebook_manual_item_id","student_id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "gradebook_manual_item_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "gradebook_manual_item_tenant_course_category_fk" FOREIGN KEY ("tenant_id","course_id","gradebook_category_id") REFERENCES "public"."gradebook_category"("tenant_id","course_id","id") ON DELETE restrict ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "gradebook_manual_grade_tenant_item_fk" FOREIGN KEY ("tenant_id","gradebook_manual_item_id") REFERENCES "public"."gradebook_manual_item"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain('CONSTRAINT "gradebook_manual_grade_score_finite_check" CHECK');
    expect(migrationSql).toContain(
      "\"gradebook_manual_grade\".\"score\"::text NOT IN ('NaN', 'Infinity', '-Infinity')",
    );
    expect(migrationSql).toContain(
      "\"gradebook_manual_grade\".\"max_score\"::text NOT IN ('NaN', 'Infinity', '-Infinity')",
    );
    expect(categoryIndex).toBeGreaterThan(-1);
    expect(manualItemIndex).toBeGreaterThan(-1);
    expect(categoryForeignKey).toBeGreaterThan(-1);
    expect(gradeForeignKey).toBeGreaterThan(-1);
    expect(categoryIndex).toBeLessThan(categoryForeignKey);
    expect(manualItemIndex).toBeLessThan(gradeForeignKey);
  });

  it('adds group assignment and submission constraints', () => {
    const migrationSql = readMigrationFile('0099_group_submissions.sql');

    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_group_set_tenant_course_id_uq" ON "course_group_set" ("tenant_id", "course_id", "id")',
    );
    expect(migrationSql).toContain(
      'ADD COLUMN "group_submission_enabled" boolean DEFAULT false NOT NULL',
    );
    expect(migrationSql).toContain('ADD COLUMN "group_set_id" text');
    expect(migrationSql).toContain('ADD CONSTRAINT "assignment_tenant_group_set_fk"');
    expect(migrationSql).toContain(
      'FOREIGN KEY ("tenant_id", "course_id", "group_set_id") REFERENCES "course_group_set" ("tenant_id", "course_id", "id") ON DELETE restrict',
    );
    expect(migrationSql).toContain('ADD CONSTRAINT "assignment_group_submission_group_set_check"');
    expect(migrationSql).toContain('ADD COLUMN "group_id" text');
    expect(migrationSql).toContain('ADD CONSTRAINT "submission_tenant_group_fk"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "submission_tenant_assignment_group_version_uq"',
    );
    expect(migrationSql).toContain('WHERE "group_id" IS NOT NULL');
  });

  it('adds quiz manual grading storage and tenant-scoped attempt/question constraints', () => {
    const migrationSql = readMigrationFile('0100_quiz_manual_grading.sql');

    expect(migrationSql).toContain('CREATE TABLE "quiz_attempt_question_grade"');
    expect(migrationSql).toContain('"score" integer NOT NULL');
    expect(migrationSql).toContain(
      'CONSTRAINT "quiz_attempt_question_grade_score_nonnegative_check" CHECK ("score" >= 0)',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "quiz_attempt_question_grade_tenant_attempt_question_uq"',
    );
    expect(migrationSql).toContain(
      'FOREIGN KEY ("tenant_id", "quiz_id", "attempt_id") REFERENCES "quiz_attempt" ("tenant_id", "quiz_id", "id") ON DELETE cascade',
    );
    expect(migrationSql).toContain(
      'FOREIGN KEY ("tenant_id", "quiz_id", "question_id") REFERENCES "quiz_question" ("tenant_id", "quiz_id", "id") ON DELETE cascade',
    );
  });

  it('rejects cross-course manual gradebook item categories and duplicate student grades', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "tenant" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "user" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "course" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          UNIQUE ("tenant_id", "id"),
          FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade
        );
        CREATE TABLE "gradebook_category" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id"),
          FOREIGN KEY ("tenant_id", "course_id") REFERENCES "course"("tenant_id", "id") ON DELETE cascade
        );
        CREATE TABLE "gradebook_manual_item" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "gradebook_category_id" text,
          "position" integer NOT NULL,
          UNIQUE ("tenant_id", "id"),
          UNIQUE ("tenant_id", "course_id", "position"),
          FOREIGN KEY ("tenant_id", "course_id") REFERENCES "course"("tenant_id", "id") ON DELETE cascade,
          FOREIGN KEY ("tenant_id", "course_id", "gradebook_category_id")
            REFERENCES "gradebook_category"("tenant_id", "course_id", "id") ON DELETE restrict
        );
        CREATE TABLE "gradebook_manual_grade" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "gradebook_manual_item_id" text NOT NULL,
          "student_id" text NOT NULL,
          UNIQUE ("tenant_id", "gradebook_manual_item_id", "student_id"),
          FOREIGN KEY ("tenant_id", "gradebook_manual_item_id")
            REFERENCES "gradebook_manual_item"("tenant_id", "id") ON DELETE cascade,
          FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE restrict
        );

        INSERT INTO "tenant" VALUES ('tenant-a');
        INSERT INTO "user" VALUES ('student-a');
        INSERT INTO "course" VALUES ('course-a', 'tenant-a'), ('course-b', 'tenant-a');
        INSERT INTO "gradebook_category" VALUES
          ('category-a', 'tenant-a', 'course-a'),
          ('category-b', 'tenant-a', 'course-b');
        INSERT INTO "gradebook_manual_item" VALUES
          ('manual-item-a', 'tenant-a', 'course-a', 'category-a', 0);
        INSERT INTO "gradebook_manual_grade" VALUES
          ('manual-grade-a', 'tenant-a', 'manual-item-a', 'student-a');
      `);

      expect(() =>
        db.run(`
          INSERT INTO "gradebook_manual_item" VALUES
            ('manual-item-b', 'tenant-a', 'course-a', 'category-b', 1);
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "gradebook_manual_grade" VALUES
            ('manual-grade-b', 'tenant-a', 'manual-item-a', 'student-a');
        `),
      ).toThrow();
      expect(countRows(db, 'SELECT COUNT(*) FROM "gradebook_manual_item"')).toBe(1);
      expect(countRows(db, 'SELECT COUNT(*) FROM "gradebook_manual_grade"')).toBe(1);
    } finally {
      db.close();
    }
  });

  it('constrains notification preferences to one frequency per tenant user category channel', () => {
    const migrationSql = readMigrationFile('0051_notification_preferences.sql');

    expect(migrationSql).toContain('CREATE TABLE "notification_preference"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "notification_preference_tenant_user_category_channel_uq" ON "notification_preference" USING btree ("tenant_id","user_id","category","channel")',
    );
    expect(migrationSql).toContain('CONSTRAINT "notification_preference_category_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "notification_preference_channel_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "notification_preference_frequency_check" CHECK');
    expect(migrationSql).toContain(
      "\"notification_preference\".\"category\" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'system')",
    );
    expect(migrationSql).toContain(
      '"notification_preference"."channel" IN (\'in_app\', \'email\')',
    );
    expect(migrationSql).toContain(
      "\"notification_preference\".\"frequency\" IN ('immediate', 'daily_digest', 'weekly_digest', 'off')",
    );
  });

  it('extends notification preference categories for announcement publication alerts', () => {
    const migrationSql = readMigrationFile('0108_announcement_notifications.sql');

    expect(migrationSql).toContain(
      'ALTER TABLE "notification_preference" DROP CONSTRAINT "notification_preference_category_check"',
    );
    expect(migrationSql).toContain(
      "\"notification_preference\".\"category\" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'announcement_published', 'system')",
    );
  });

  it('adds discussion subscriptions and notification preference category support', () => {
    const migrationSql = readMigrationFile('0109_discussion_reply_notifications.sql');

    expect(migrationSql).toContain('CREATE TABLE "discussion_topic_subscription"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "discussion_topic_subscription_tenant_topic_user_uq" ON "discussion_topic_subscription" USING btree ("tenant_id","topic_id","user_id")',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "discussion_topic_subscription_tenant_topic_fk" FOREIGN KEY ("tenant_id","topic_id") REFERENCES "public"."discussion_topic"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      "\"notification_preference\".\"category\" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'announcement_published', 'discussion_reply', 'system')",
    );
  });

  it('constrains discussion posts to draft and moderation statuses', () => {
    const migrationSql = readMigrationFile('0110_discussion_post_drafts.sql');

    expect(migrationSql).toContain('CONSTRAINT "discussion_post_status_check" CHECK');
    expect(migrationSql).toContain(
      "\"discussion_post\".\"status\" IN ('draft', 'published', 'hidden', 'deleted')",
    );
  });

  it('adds ordered positions to course resources for module sequencing', () => {
    const migrationSql = readMigrationFile('0052_course_resource_positions.sql');
    const addColumnIndex = migrationSql.indexOf(
      'ALTER TABLE "course_resource" ADD COLUMN "position"',
    );
    const backfillIndex = migrationSql.indexOf('WITH ranked_course_resources AS');
    const notNullIndex = migrationSql.indexOf(
      'ALTER TABLE "course_resource" ALTER COLUMN "position" SET NOT NULL',
    );

    expect(migrationSql).toContain('ALTER TABLE "course_resource" ADD COLUMN "position"');
    expect(migrationSql).toContain('PARTITION BY "tenant_id", "course_id", "module_id", "unit_id"');
    expect(migrationSql).toContain('ORDER BY "title", "id"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_unit_tenant_module_id_uq" ON "course_unit" USING btree ("tenant_id","module_id","id")',
    );
    expect(migrationSql).toContain('SET "module_id" = "course_unit"."module_id"');
    expect(migrationSql).toContain('CONSTRAINT "course_resource_unit_requires_module_check" CHECK');
    expect(migrationSql).toContain('"course_resource"."unit_id" IS NULL OR');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_resource_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","module_id","id") ON DELETE no action ON UPDATE no action',
    );
    expect(migrationSql).not.toContain('ON DELETE SET NULL ("module_id","unit_id")');
    expect(migrationSql).toContain('CONSTRAINT "course_resource_position_nonnegative_check" CHECK');
    expect(migrationSql).toContain('"course_resource"."position" >= 0');
    expect(addColumnIndex).toBeGreaterThan(-1);
    expect(backfillIndex).toBeGreaterThan(-1);
    expect(notNullIndex).toBeGreaterThan(-1);
    expect(addColumnIndex).toBeLessThan(backfillIndex);
    expect(backfillIndex).toBeLessThan(notNullIndex);
  });

  it('preserves resource module scope when a resource unit is deleted', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "tenant" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "course" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          UNIQUE ("tenant_id", "id"),
          FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade
        );
        CREATE TABLE "course_module" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          UNIQUE ("tenant_id", "id"),
          FOREIGN KEY ("tenant_id", "course_id") REFERENCES "course"("tenant_id", "id") ON DELETE cascade
        );
        CREATE TABLE "course_unit" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "module_id" text NOT NULL,
          UNIQUE ("tenant_id", "id"),
          UNIQUE ("tenant_id", "module_id", "id"),
          FOREIGN KEY ("tenant_id", "module_id") REFERENCES "course_module"("tenant_id", "id") ON DELETE cascade
        );
        CREATE TABLE "course_resource" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "module_id" text,
          "unit_id" text,
          "position" integer NOT NULL,
          CHECK ("unit_id" IS NULL OR "module_id" IS NOT NULL),
          CHECK ("position" >= 0),
          FOREIGN KEY ("unit_id") REFERENCES "course_unit"("id") ON DELETE SET NULL,
          FOREIGN KEY ("tenant_id", "module_id", "unit_id")
            REFERENCES "course_unit"("tenant_id", "module_id", "id") ON DELETE NO ACTION
        );

        INSERT INTO "tenant" VALUES ('tenant-a');
        INSERT INTO "course" VALUES ('course-a', 'tenant-a');
        INSERT INTO "course_module" VALUES
          ('module-a', 'tenant-a', 'course-a'),
          ('module-b', 'tenant-a', 'course-a');
        INSERT INTO "course_unit" VALUES
          ('unit-a', 'tenant-a', 'course-a', 'module-a');
        INSERT INTO "course_resource" VALUES
          ('resource-a', 'tenant-a', 'course-a', 'module-a', 'unit-a', 0);
      `);

      expect(() =>
        db.run(`
          INSERT INTO "course_resource" VALUES
            ('resource-b', 'tenant-a', 'course-a', NULL, 'unit-a', 1);
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "course_resource" VALUES
            ('resource-c', 'tenant-a', 'course-a', 'module-b', 'unit-a', 1);
        `),
      ).toThrow();

      db.run('DELETE FROM "course_unit" WHERE "id" = ?', ['unit-a']);

      const row = db.exec('SELECT "module_id", "unit_id" FROM "course_resource" WHERE "id" = ?', [
        'resource-a',
      ])[0]?.values[0];

      expect(row).toEqual(['module-a', null]);
    } finally {
      db.close();
    }
  });

  it('adds module placements to assignments for module sequencing', () => {
    const migrationSql = readMigrationFile('0053_assignment_module_placements.sql');

    expect(migrationSql).toContain('ALTER TABLE "assignment" ADD COLUMN "module_id"');
    expect(migrationSql).toContain('ALTER TABLE "assignment" ADD COLUMN "unit_id"');
    expect(migrationSql).toContain('ALTER TABLE "assignment" ADD COLUMN "position"');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_module_tenant_course_id_uq" ON "course_module" USING btree ("tenant_id","course_id","id")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_unit_tenant_course_id_uq" ON "course_unit" USING btree ("tenant_id","course_id","id")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_unit_tenant_course_module_id_uq" ON "course_unit" USING btree ("tenant_id","course_id","module_id","id")',
    );
    expect(migrationSql).toContain('CONSTRAINT "assignment_unit_requires_module_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "assignment_position_nonnegative_check" CHECK');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_tenant_module_fk" FOREIGN KEY ("tenant_id","course_id","module_id") REFERENCES "public"."course_module"("tenant_id","course_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_tenant_unit_fk" FOREIGN KEY ("tenant_id","course_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","course_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","module_id","id") ON DELETE no action ON UPDATE no action',
    );
    expect(migrationSql).not.toContain(
      'ADD CONSTRAINT "assignment_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id")',
    );
    expect(migrationSql).not.toContain(
      'ADD CONSTRAINT "assignment_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id")',
    );
  });

  it('adds recording and playback URLs to course meetings', () => {
    const migrationSql = readMigrationFile('0113_course_meeting_recording_links.sql');

    expect(migrationSql).toContain('ALTER TABLE "course_meeting" ADD COLUMN "recording_url"');
    expect(migrationSql).toContain('ALTER TABLE "course_meeting" ADD COLUMN "playback_url"');
  });

  it('adds meeting details to course sections', () => {
    const migrationSql = readMigrationFile('0114_course_section_meeting_details.sql');

    expect(migrationSql).toContain('ALTER TABLE "course_section" ADD COLUMN "meeting_days"');
    expect(migrationSql).toContain('ALTER TABLE "course_section" ADD COLUMN "meeting_start_time"');
    expect(migrationSql).toContain('ALTER TABLE "course_section" ADD COLUMN "meeting_end_time"');
    expect(migrationSql).toContain('ALTER TABLE "course_section" ADD COLUMN "location"');
    expect(migrationSql).toContain('CONSTRAINT "course_section_meeting_time_pair_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "course_section_meeting_time_order_check" CHECK');
  });

  it('adds section-level instructor assignments', () => {
    const migrationSql = readMigrationFile('0126_course_section_instructor.sql');

    expect(migrationSql).toContain('CREATE TABLE "course_section_instructor"');
    expect(migrationSql).toContain('"instructor_id" text NOT NULL');
    expect(migrationSql).toContain('course_section_instructor_tenant_course_fk');
    expect(migrationSql).toContain('course_section_instructor_tenant_section_fk');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_section_instructor_tenant_section_instructor_uq"',
    );
  });

  it('adds preserved deletion state to users without removing academic references', () => {
    const migrationSql = readMigrationFile('0115_user_preserved_deletion.sql');

    expect(migrationSql).toContain(
      'ALTER TABLE "user" ADD COLUMN "status" text DEFAULT \'active\' NOT NULL',
    );
    expect(migrationSql).toContain('ALTER TABLE "user" ADD COLUMN "deleted_at"');
    expect(migrationSql).toContain('CONSTRAINT "user_status_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "user_deleted_at_status_check" CHECK');
    expect(migrationSql).not.toContain('DROP TABLE');
    expect(migrationSql).not.toContain('DELETE FROM "user"');
  });

  it('adds tenant-scoped user legal holds for deletion retention checks', () => {
    const migrationSql = readMigrationFile('0116_user_legal_holds.sql');

    expect(migrationSql).toContain('CREATE TABLE "user_legal_hold"');
    expect(migrationSql).toContain('CONSTRAINT "user_legal_hold_tenant_fk"');
    expect(migrationSql).toContain('CONSTRAINT "user_legal_hold_user_fk"');
    expect(migrationSql).toContain('CREATE UNIQUE INDEX "user_legal_hold_active_user_tenant_uq"');
    expect(migrationSql).toContain('WHERE "released_at" IS NULL');
  });

  it('adds tenant retention policies and user retention deadlines', () => {
    const migrationSql = readMigrationFile('0117_retention_policies.sql');

    expect(migrationSql).toContain('ALTER TABLE "user" ADD COLUMN "retain_until"');
    expect(migrationSql).toContain('CONSTRAINT "user_retain_until_status_check" CHECK');
    expect(migrationSql).toContain('CREATE TABLE "retention_policy"');
    expect(migrationSql).toContain('CONSTRAINT "retention_policy_tenant_fk"');
    expect(migrationSql).toContain('CONSTRAINT "retention_policy_target_type_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "retention_policy_retain_days_check" CHECK');
    expect(migrationSql).toContain('"retain_days" <= 3650');
    expect(migrationSql).toContain('CREATE UNIQUE INDEX "retention_policy_tenant_target_uq"');
    expect(migrationSql).not.toContain('DELETE FROM "user"');
  });

  it('adds module placements to quizzes for module sequencing', () => {
    const migrationSql = readMigrationFile('0054_quiz_module_placements.sql');

    expect(migrationSql).toContain('ALTER TABLE "quiz" ADD COLUMN "module_id"');
    expect(migrationSql).toContain('ALTER TABLE "quiz" ADD COLUMN "unit_id"');
    expect(migrationSql).toContain('ALTER TABLE "quiz" ADD COLUMN "position"');
    expect(migrationSql).toContain('CONSTRAINT "quiz_unit_requires_module_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "quiz_position_nonnegative_check" CHECK');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "quiz_tenant_module_fk" FOREIGN KEY ("tenant_id","course_id","module_id") REFERENCES "public"."course_module"("tenant_id","course_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "quiz_tenant_unit_fk" FOREIGN KEY ("tenant_id","course_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "quiz_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","course_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","module_id","id") ON DELETE no action ON UPDATE no action',
    );
    expect(migrationSql).not.toContain(
      'ADD CONSTRAINT "quiz_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id")',
    );
    expect(migrationSql).not.toContain(
      'ADD CONSTRAINT "quiz_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id")',
    );
  });

  it('adds module placements to discussion topics for module sequencing', () => {
    const migrationSql = readMigrationFile('0056_discussion_topic_module_placements.sql');

    expect(migrationSql).toContain('ALTER TABLE "discussion_topic" ADD COLUMN "module_id"');
    expect(migrationSql).toContain('ALTER TABLE "discussion_topic" ADD COLUMN "unit_id"');
    expect(migrationSql).toContain(
      'CONSTRAINT "discussion_topic_unit_requires_module_check" CHECK',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "discussion_topic_position_nonnegative_check" CHECK',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "discussion_topic_tenant_module_fk" FOREIGN KEY ("tenant_id","course_id","module_id") REFERENCES "public"."course_module"("tenant_id","course_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "discussion_topic_tenant_unit_fk" FOREIGN KEY ("tenant_id","course_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "discussion_topic_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","course_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","module_id","id") ON DELETE no action ON UPDATE no action',
    );
    expect(migrationSql).not.toContain(
      'ADD CONSTRAINT "discussion_topic_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id")',
    );
    expect(migrationSql).not.toContain(
      'ADD CONSTRAINT "discussion_topic_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id")',
    );
  });

  it('adds quiz attempt responses for learner answers', () => {
    const migrationSql = readMigrationFile('0055_quiz_attempt_responses.sql');

    expect(migrationSql).toContain('CREATE TABLE "quiz_attempt_response"');
    expect(migrationSql).toContain('"answer" jsonb NOT NULL');
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "quiz_attempt_tenant_quiz_id_uq" ON "quiz_attempt" USING btree ("tenant_id","quiz_id","id")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "quiz_question_tenant_quiz_id_uq" ON "quiz_question" USING btree ("tenant_id","quiz_id","id")',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "quiz_attempt_response_tenant_attempt_question_uq" ON "quiz_attempt_response" USING btree ("tenant_id","attempt_id","question_id")',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "quiz_attempt_response_tenant_quiz_attempt_fk" FOREIGN KEY ("tenant_id","quiz_id","attempt_id") REFERENCES "public"."quiz_attempt"("tenant_id","quiz_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "quiz_attempt_response_tenant_quiz_question_fk" FOREIGN KEY ("tenant_id","quiz_id","question_id") REFERENCES "public"."quiz_question"("tenant_id","quiz_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(
      migrationSql.indexOf('CREATE UNIQUE INDEX "quiz_attempt_tenant_quiz_id_uq"'),
    ).toBeLessThan(
      migrationSql.indexOf('CONSTRAINT "quiz_attempt_response_tenant_quiz_attempt_fk"'),
    );
    expect(
      migrationSql.indexOf('CREATE UNIQUE INDEX "quiz_question_tenant_quiz_id_uq"'),
    ).toBeLessThan(
      migrationSql.indexOf('CONSTRAINT "quiz_attempt_response_tenant_quiz_question_fk"'),
    );
  });

  it('constrains assignment placements to the assignment course', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "tenant" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "course" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          UNIQUE ("tenant_id", "id")
        );
        CREATE TABLE "course_module" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id")
        );
        CREATE TABLE "course_unit" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "module_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id"),
          UNIQUE ("tenant_id", "course_id", "module_id", "id")
        );
        CREATE TABLE "assignment" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "module_id" text,
          "unit_id" text,
          "position" integer,
          CHECK ("unit_id" IS NULL OR "module_id" IS NOT NULL),
          CHECK ("position" IS NULL OR "position" >= 0),
          FOREIGN KEY ("module_id") REFERENCES "course_module"("id") ON DELETE SET NULL,
          FOREIGN KEY ("unit_id") REFERENCES "course_unit"("id") ON DELETE SET NULL,
          FOREIGN KEY ("tenant_id", "course_id", "module_id")
            REFERENCES "course_module"("tenant_id", "course_id", "id") ON DELETE NO ACTION,
          FOREIGN KEY ("tenant_id", "course_id", "unit_id")
            REFERENCES "course_unit"("tenant_id", "course_id", "id") ON DELETE NO ACTION,
          FOREIGN KEY ("tenant_id", "course_id", "module_id", "unit_id")
            REFERENCES "course_unit"("tenant_id", "course_id", "module_id", "id") ON DELETE NO ACTION
        );

        INSERT INTO "tenant" VALUES ('tenant-a');
        INSERT INTO "course" VALUES ('course-a', 'tenant-a'), ('course-b', 'tenant-a');
        INSERT INTO "course_module" VALUES
          ('module-a', 'tenant-a', 'course-a'),
          ('module-b', 'tenant-a', 'course-b');
        INSERT INTO "course_unit" VALUES
          ('unit-a', 'tenant-a', 'course-a', 'module-a'),
          ('unit-b', 'tenant-a', 'course-b', 'module-b');
        INSERT INTO "assignment" VALUES
          ('assignment-a', 'tenant-a', 'course-a', 'module-a', 'unit-a', 0);
      `);

      expect(() =>
        db.run(`
          INSERT INTO "assignment" VALUES
            ('assignment-b', 'tenant-a', 'course-a', 'module-b', NULL, 0);
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "assignment" VALUES
            ('assignment-c', 'tenant-a', 'course-a', 'module-a', 'unit-b', 0);
        `),
      ).toThrow();

      db.run('DELETE FROM "course_unit" WHERE "id" = ?', ['unit-a']);
      expect(
        db.exec('SELECT "tenant_id", "module_id", "unit_id" FROM "assignment" WHERE "id" = ?', [
          'assignment-a',
        ])[0]?.values[0],
      ).toEqual(['tenant-a', 'module-a', null]);

      db.run('DELETE FROM "course_module" WHERE "id" = ?', ['module-a']);
      expect(
        db.exec('SELECT "tenant_id", "module_id", "unit_id" FROM "assignment" WHERE "id" = ?', [
          'assignment-a',
        ])[0]?.values[0],
      ).toEqual(['tenant-a', null, null]);
    } finally {
      db.close();
    }
  });

  it('constrains quiz attempt responses to questions from the attempted quiz', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "quiz_attempt" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "quiz_id" text NOT NULL,
          UNIQUE ("tenant_id", "quiz_id", "id")
        );
        CREATE TABLE "quiz_question" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "quiz_id" text NOT NULL,
          "position" integer NOT NULL,
          UNIQUE ("tenant_id", "quiz_id", "id")
        );
        CREATE TABLE "quiz_attempt_response" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "quiz_id" text NOT NULL,
          "attempt_id" text NOT NULL,
          "question_id" text NOT NULL,
          "answer" text NOT NULL,
          UNIQUE ("tenant_id", "attempt_id", "question_id"),
          FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempt"("id") ON DELETE CASCADE,
          FOREIGN KEY ("question_id") REFERENCES "quiz_question"("id") ON DELETE CASCADE,
          FOREIGN KEY ("tenant_id", "quiz_id", "attempt_id")
            REFERENCES "quiz_attempt"("tenant_id", "quiz_id", "id") ON DELETE CASCADE,
          FOREIGN KEY ("tenant_id", "quiz_id", "question_id")
            REFERENCES "quiz_question"("tenant_id", "quiz_id", "id") ON DELETE CASCADE
        );

        INSERT INTO "quiz_attempt" VALUES ('attempt-a', 'tenant-a', 'quiz-a');
        INSERT INTO "quiz_question" VALUES
          ('question-a', 'tenant-a', 'quiz-a', 0),
          ('question-b', 'tenant-a', 'quiz-b', 0);
        INSERT INTO "quiz_attempt_response" VALUES
          ('response-a', 'tenant-a', 'quiz-a', 'attempt-a', 'question-a', '{"kind":"choice"}');
      `);

      expect(() =>
        db.run(`
          INSERT INTO "quiz_attempt_response" VALUES
            ('response-b', 'tenant-a', 'quiz-a', 'attempt-a', 'question-b', '{"kind":"choice"}');
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "quiz_attempt_response" VALUES
            ('response-c', 'tenant-a', 'quiz-a', 'attempt-a', 'question-a', '{"kind":"choice"}');
        `),
      ).toThrow();

      db.run('DELETE FROM "quiz_question" WHERE "id" = ?', ['question-a']);
      expect(db.exec('SELECT COUNT(*) FROM "quiz_attempt_response"')[0]?.values[0]).toEqual([0]);

      db.run(`
        INSERT INTO "quiz_question" VALUES ('question-a', 'tenant-a', 'quiz-a', 0);
        INSERT INTO "quiz_attempt_response" VALUES
          ('response-d', 'tenant-a', 'quiz-a', 'attempt-a', 'question-a', '{"kind":"choice"}');
      `);

      db.run('DELETE FROM "quiz_attempt" WHERE "id" = ?', ['attempt-a']);
      expect(db.exec('SELECT COUNT(*) FROM "quiz_attempt_response"')[0]?.values[0]).toEqual([0]);
    } finally {
      db.close();
    }
  });

  it('constrains quiz placements to the quiz course', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "tenant" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "course" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          UNIQUE ("tenant_id", "id")
        );
        CREATE TABLE "course_module" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id")
        );
        CREATE TABLE "course_unit" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "module_id" text NOT NULL,
          UNIQUE ("tenant_id", "course_id", "id"),
          UNIQUE ("tenant_id", "course_id", "module_id", "id")
        );
        CREATE TABLE "quiz" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "course_id" text NOT NULL,
          "module_id" text,
          "unit_id" text,
          "position" integer,
          CHECK ("unit_id" IS NULL OR "module_id" IS NOT NULL),
          CHECK ("position" IS NULL OR "position" >= 0),
          FOREIGN KEY ("module_id") REFERENCES "course_module"("id") ON DELETE SET NULL,
          FOREIGN KEY ("unit_id") REFERENCES "course_unit"("id") ON DELETE SET NULL,
          FOREIGN KEY ("tenant_id", "course_id", "module_id")
            REFERENCES "course_module"("tenant_id", "course_id", "id") ON DELETE NO ACTION,
          FOREIGN KEY ("tenant_id", "course_id", "unit_id")
            REFERENCES "course_unit"("tenant_id", "course_id", "id") ON DELETE NO ACTION,
          FOREIGN KEY ("tenant_id", "course_id", "module_id", "unit_id")
            REFERENCES "course_unit"("tenant_id", "course_id", "module_id", "id") ON DELETE NO ACTION
        );

        INSERT INTO "tenant" VALUES ('tenant-a');
        INSERT INTO "course" VALUES ('course-a', 'tenant-a'), ('course-b', 'tenant-a');
        INSERT INTO "course_module" VALUES
          ('module-a', 'tenant-a', 'course-a'),
          ('module-b', 'tenant-a', 'course-b');
        INSERT INTO "course_unit" VALUES
          ('unit-a', 'tenant-a', 'course-a', 'module-a'),
          ('unit-b', 'tenant-a', 'course-b', 'module-b');
        INSERT INTO "quiz" VALUES
          ('quiz-a', 'tenant-a', 'course-a', 'module-a', 'unit-a', 0);
      `);

      expect(() =>
        db.run(`
          INSERT INTO "quiz" VALUES
            ('quiz-b', 'tenant-a', 'course-a', 'module-b', NULL, 0);
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "quiz" VALUES
            ('quiz-c', 'tenant-a', 'course-a', 'module-a', 'unit-b', 0);
        `),
      ).toThrow();

      db.run('DELETE FROM "course_unit" WHERE "id" = ?', ['unit-a']);
      expect(
        db.exec('SELECT "tenant_id", "module_id", "unit_id" FROM "quiz" WHERE "id" = ?', [
          'quiz-a',
        ])[0]?.values[0],
      ).toEqual(['tenant-a', 'module-a', null]);

      db.run('DELETE FROM "course_module" WHERE "id" = ?', ['module-a']);
      expect(
        db.exec('SELECT "tenant_id", "module_id", "unit_id" FROM "quiz" WHERE "id" = ?', [
          'quiz-a',
        ])[0]?.values[0],
      ).toEqual(['tenant-a', null, null]);
    } finally {
      db.close();
    }
  });

  it('rejects duplicate and invalid notification preferences', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    try {
      db.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE "tenant" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "user" ("id" text PRIMARY KEY NOT NULL);
        CREATE TABLE "notification_preference" (
          "id" text PRIMARY KEY NOT NULL,
          "tenant_id" text NOT NULL,
          "user_id" text NOT NULL,
          "category" text NOT NULL,
          "channel" text NOT NULL,
          "frequency" text NOT NULL,
          UNIQUE ("tenant_id", "user_id", "category", "channel"),
          CHECK ("category" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'system')),
          CHECK ("channel" IN ('in_app', 'email')),
          CHECK ("frequency" IN ('immediate', 'daily_digest', 'weekly_digest', 'off')),
          FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
        );

        INSERT INTO "tenant" VALUES ('tenant-a');
        INSERT INTO "user" VALUES ('user-a');
        INSERT INTO "notification_preference" VALUES
          ('preference-a', 'tenant-a', 'user-a', 'grade_published', 'email', 'daily_digest');
      `);

      expect(() =>
        db.run(`
          INSERT INTO "notification_preference" VALUES
            ('preference-b', 'tenant-a', 'user-a', 'grade_published', 'email', 'off');
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "notification_preference" VALUES
            ('preference-c', 'tenant-a', 'user-a', 'unknown_category', 'email', 'daily_digest');
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "notification_preference" VALUES
            ('preference-d', 'tenant-a', 'user-a', 'grade_published', 'sms', 'daily_digest');
        `),
      ).toThrow();
      expect(() =>
        db.run(`
          INSERT INTO "notification_preference" VALUES
            ('preference-e', 'tenant-a', 'user-a', 'grade_published', 'in_app', 'monthly');
        `),
      ).toThrow();
      expect(countRows(db, 'SELECT COUNT(*) FROM "notification_preference"')).toBe(1);
    } finally {
      db.close();
    }
  });

  it('sets assignment active rubric references to null through both rubric foreign keys', () => {
    const migrationSql = readMigrationSql();

    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_tenant_active_rubric_fk" FOREIGN KEY ("tenant_id","active_rubric_id") REFERENCES "public"."rubric"("tenant_id","id") ON DELETE SET NULL ("active_rubric_id") ON UPDATE no action',
    );
  });

  it('enforces grade score bounds in database constraints', () => {
    const migrationSql = readMigrationSql();

    expect(migrationSql).toContain('CONSTRAINT "grade_score_nonnegative_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "grade_max_score_positive_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "grade_score_lte_max_score_check" CHECK');
  });

  it('enforces positive AI policy rule versions in database constraints', () => {
    const migrationSql = readMigrationSql();

    expect(migrationSql).toContain('CONSTRAINT "ai_policy_rule_version_positive_check" CHECK');
  });

  it('sets nullable tenant-scoped foreign key references to null through the nullable column', () => {
    const migrationSql = readMigrationSql();

    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_resource_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_resource_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "published_feedback_tenant_human_review_fk" FOREIGN KEY ("tenant_id","human_review_id") REFERENCES "public"."human_review"("tenant_id","id") ON DELETE SET NULL ("human_review_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "published_feedback_tenant_linked_grade_fk" FOREIGN KEY ("tenant_id","linked_grade_id") REFERENCES "public"."grade"("tenant_id","id") ON DELETE SET NULL ("linked_grade_id") ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "export_job_tenant_storage_file_fk" FOREIGN KEY ("tenant_id","storage_file_id") REFERENCES "public"."file_resource"("tenant_id","id") ON DELETE SET NULL ("storage_file_id") ON UPDATE no action',
    );
  });

  it('creates discussion tenant identity indexes before discussion tenant foreign keys', () => {
    const migrationSql = readMigrationFile('0024_course_discussions.sql');
    const topicIndexIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "discussion_topic_tenant_id_uq"',
    );
    const postIndexIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "discussion_post_tenant_id_uq"',
    );
    const postTopicIndexIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "discussion_post_tenant_topic_id_uq"',
    );
    const topicForeignKeyIndex = migrationSql.indexOf(
      'ADD CONSTRAINT "discussion_post_tenant_topic_fk"',
    );
    const parentPostForeignKeyIndex = migrationSql.indexOf(
      'ADD CONSTRAINT "discussion_post_tenant_parent_post_fk"',
    );

    expect(topicIndexIndex).toBeGreaterThan(-1);
    expect(postIndexIndex).toBeGreaterThan(-1);
    expect(postTopicIndexIndex).toBeGreaterThan(-1);
    expect(topicForeignKeyIndex).toBeGreaterThan(-1);
    expect(parentPostForeignKeyIndex).toBeGreaterThan(-1);
    expect(topicIndexIndex).toBeLessThan(topicForeignKeyIndex);
    expect(postIndexIndex).toBeLessThan(parentPostForeignKeyIndex);
    expect(postTopicIndexIndex).toBeLessThan(parentPostForeignKeyIndex);
  });

  it('keeps discussion replies inside their topic and authors linked to users', () => {
    const migrationSql = readMigrationFile('0024_course_discussions.sql');

    expect(migrationSql).toContain(
      'ADD CONSTRAINT "discussion_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "discussion_post_tenant_parent_post_fk" FOREIGN KEY ("tenant_id","topic_id","parent_post_id") REFERENCES "public"."discussion_post"("tenant_id","topic_id","id") ON DELETE SET NULL ("parent_post_id") ON UPDATE no action',
    );
  });

  it('creates course group tenant indexes before composite foreign keys use them', () => {
    const migrationSql = readMigrationFile('0032_large_captain_universe.sql');
    const groupSetIndexIndex = migrationSql.indexOf(
      'CREATE UNIQUE INDEX "course_group_set_tenant_id_uq"',
    );
    const groupIndexIndex = migrationSql.indexOf('CREATE UNIQUE INDEX "course_group_tenant_id_uq"');
    const groupSetForeignKeyIndex = migrationSql.indexOf(
      'ADD CONSTRAINT "course_group_tenant_group_set_fk"',
    );
    const groupMemberForeignKeyIndex = migrationSql.indexOf(
      'ADD CONSTRAINT "course_group_member_tenant_group_fk"',
    );

    expect(groupSetIndexIndex).toBeGreaterThan(-1);
    expect(groupIndexIndex).toBeGreaterThan(-1);
    expect(groupSetForeignKeyIndex).toBeGreaterThan(-1);
    expect(groupMemberForeignKeyIndex).toBeGreaterThan(-1);
    expect(groupSetIndexIndex).toBeLessThan(groupSetForeignKeyIndex);
    expect(groupIndexIndex).toBeLessThan(groupMemberForeignKeyIndex);
  });

  it('creates question bank tenant indexes before composite foreign keys use them', () => {
    const migrationSql = readMigrationFile('0040_mighty_stellaris.sql');
    const bankIndexIndex = migrationSql.indexOf('CREATE UNIQUE INDEX "question_bank_tenant_id_uq"');
    const bankQuestionForeignKeyIndex = migrationSql.indexOf(
      'ADD CONSTRAINT "question_bank_question_tenant_bank_fk"',
    );

    expect(bankIndexIndex).toBeGreaterThan(-1);
    expect(bankQuestionForeignKeyIndex).toBeGreaterThan(-1);
    expect(bankIndexIndex).toBeLessThan(bankQuestionForeignKeyIndex);
  });

  it('creates assignment override constraints for scoped availability exceptions', () => {
    const migrationSql = readMigrationFile('0042_flippant_revanche.sql');

    expect(migrationSql).toContain('CREATE TABLE "assignment_override"');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "assignment_override_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "assignment_override_tenant_assignment_target_uq" ON "assignment_override" USING btree ("tenant_id","assignment_id","target_type","target_id")',
    );
    expect(migrationSql).toContain('CONSTRAINT "assignment_override_target_type_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "assignment_override_status_check" CHECK');
    expect(migrationSql).toContain(
      'CONSTRAINT "assignment_override_availability_window_check" CHECK',
    );
  });

  it('creates course calendar event constraints for LMS calendar entries', () => {
    const migrationSql = readMigrationFile('0043_dazzling_korg.sql');

    expect(migrationSql).toContain('CREATE TABLE "course_calendar_event"');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_calendar_event_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_calendar_event_tenant_id_uq" ON "course_calendar_event" USING btree ("tenant_id","id")',
    );
    expect(migrationSql).toContain('CONSTRAINT "course_calendar_event_visibility_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "course_calendar_event_time_range_check" CHECK');
  });

  it('creates course syllabus constraints for one canonical syllabus per course', () => {
    const migrationSql = readMigrationFile('0044_hard_justice.sql');

    expect(migrationSql).toContain('CREATE TABLE "course_syllabus"');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_syllabus_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action',
    );
    expect(migrationSql).toContain(
      'CREATE UNIQUE INDEX "course_syllabus_tenant_course_uq" ON "course_syllabus" USING btree ("tenant_id","course_id")',
    );
    expect(migrationSql).toContain('CONSTRAINT "course_syllabus_body_length_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "course_syllabus_visibility_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "course_syllabus_version_positive_check" CHECK');
  });

  it('creates quiz override constraints for quiz accommodations', () => {
    const migrationSql = readMigrationFile('0101_quiz_overrides.sql');

    expect(migrationSql).toContain('CREATE TABLE "quiz_override"');
    expect(migrationSql).toContain('CREATE UNIQUE INDEX "quiz_override_tenant_quiz_target_uq"');
    expect(migrationSql).toContain('CONSTRAINT "quiz_override_target_type_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "quiz_override_status_check" CHECK');
    expect(migrationSql).toContain('CONSTRAINT "quiz_override_availability_window_check" CHECK');
    expect(migrationSql).toContain(
      'CONSTRAINT "quiz_override_time_limit_minutes_positive_check" CHECK',
    );
    expect(migrationSql).toContain('CONSTRAINT "quiz_override_max_attempts_positive_check" CHECK');
    expect(migrationSql).toContain('ADD CONSTRAINT "quiz_override_tenant_quiz_fk"');
  });

  it('adds module-scoped completion requirement score threshold constraints', () => {
    const migrationSql = readMigrationFile('0102_completion_rule_thresholds.sql');

    expect(migrationSql).toContain('ADD COLUMN "module_id" text');
    expect(migrationSql).toContain('ADD COLUMN "min_score_percent" real');
    expect(migrationSql).toContain('ADD CONSTRAINT "completion_requirement_tenant_module_fk"');
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "completion_requirement_tenant_course_module_fk"',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "completion_requirement_min_score_percent_range_check"',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "completion_requirement_min_score_percent_type_check"',
    );
    expect(migrationSql).toContain(
      'ADD CONSTRAINT "completion_requirement_pass_quiz_target_check"',
    );
    expect(migrationSql).toContain('ADD CONSTRAINT "completion_requirement_manual_target_check"');
  });

  it('adds item-scoped module release rule target constraints', () => {
    const migrationSql = readMigrationFile('0103_item_release_rule_targets.sql');

    expect(migrationSql).toContain('ADD COLUMN "target_type" text DEFAULT \'module\' NOT NULL');
    expect(migrationSql).toContain('ADD COLUMN "target_id" text');
    expect(migrationSql).toContain('ADD CONSTRAINT "course_module_release_rule_target_type_check"');
    expect(migrationSql).toContain('ADD CONSTRAINT "course_module_release_rule_target_id_check"');
  });

  it('adds push as a notification preference channel', () => {
    const migrationSql = readMigrationFile('0104_notification_push_channel.sql');

    expect(migrationSql).toContain('DROP CONSTRAINT "notification_preference_channel_check"');
    expect(migrationSql).toContain(
      "\"notification_preference\".\"channel\" IN ('in_app', 'email', 'push')",
    );
  });

  it('keeps manual unlock release rules module-scoped', () => {
    const migrationSql = readMigrationFile('0105_module_release_manual_unlock_targets.sql');

    expect(migrationSql).toContain(
      'ADD CONSTRAINT "course_module_release_rule_manual_unlock_target_check"',
    );
    expect(migrationSql).toContain('"rule_type" = \'manual_unlock\'');
    expect(migrationSql).toContain('"target_type" <> \'module\'');
  });

  it('keeps the latest migration snapshot aligned with manual LMS table migrations', () => {
    const snapshot = readMigrationSnapshot('0056_snapshot.json');

    expect(snapshot).toContain('"public.course_section"');
    expect(snapshot).toContain('"public.course_announcement"');
    expect(snapshot).toContain('"course_announcement_tenant_course_status_idx"');
    expect(snapshot).toContain('"public.discussion_topic"');
    expect(snapshot).toContain('"public.discussion_post"');
    expect(snapshot).toContain('"public.quiz"');
    expect(snapshot).toContain('"public.quiz_question"');
    expect(snapshot).toContain('"quiz_question_points_nonnegative_check"');
    expect(snapshot).toContain('"public.quiz_attempt"');
    expect(snapshot).toContain('"quiz_attempt_tenant_quiz_student_attempt_uq"');
    expect(snapshot).toContain('"public.question_bank"');
    expect(snapshot).toContain('"question_bank_tenant_course_status_title_idx"');
    expect(snapshot).toContain('"question_bank_status_check"');
    expect(snapshot).toContain('"public.question_bank_question"');
    expect(snapshot).toContain('"question_bank_question_tenant_bank_position_uq"');
    expect(snapshot).toContain('"question_bank_question_tenant_bank_fk"');
    expect(snapshot).toContain('"question_bank_question_points_nonnegative_check"');
    expect(snapshot).toContain('"public.attendance_session"');
    expect(snapshot).toContain('"public.attendance_record"');
    expect(snapshot).toContain('"attendance_session_time_range_check"');
    expect(snapshot).toContain('"public.completion_requirement"');
    expect(snapshot).toContain('"public.completion_progress"');
    expect(snapshot).toContain('"completion_requirement_position_nonnegative_check"');
    expect(snapshot).toContain('"public.course_credential"');
    expect(snapshot).toContain('"public.credential_award"');
    expect(snapshot).toContain('"credential_award_tenant_credential_student_uq"');
    expect(snapshot).toContain('"public.conversation_thread"');
    expect(snapshot).toContain('"public.conversation_message"');
    expect(snapshot).toContain('"conversation_thread_participant_ids_gin_idx"');
    expect(snapshot).toContain('"conversation_message_tenant_thread_fk"');
    expect(snapshot).toContain('"public.course_group_set"');
    expect(snapshot).toContain('"public.course_group"');
    expect(snapshot).toContain('"public.course_group_member"');
    expect(snapshot).toContain('"course_group_member_tenant_group_user_uq"');
    expect(snapshot).toContain('"course_group_member_tenant_user_idx"');
    expect(snapshot).toContain('"public.submission_attachment"');
    expect(snapshot).toContain('"submission_attachment_tenant_submission_position_uq"');
    expect(snapshot).toContain('"submission_attachment_tenant_file_fk"');
    expect(snapshot).toContain('"submission_attachment_position_nonnegative_check"');
    expect(snapshot).toContain('"submission_attachment_display_name_length_check"');
    expect(snapshot).toContain('"public.submission_comment"');
    expect(snapshot).toContain('"submission_comment_tenant_submission_created_idx"');
    expect(snapshot).toContain('"submission_comment_tenant_submission_fk"');
    expect(snapshot).toContain('"submission_comment_body_length_check"');
    expect(snapshot).toContain('"submission_comment_visibility_check"');
    expect(snapshot).toContain('"public.assignment_peer_review"');
    expect(snapshot).toContain('"submission_tenant_assignment_id_uq"');
    expect(snapshot).toContain('"assignment_peer_review_tenant_assignment_reviewer_submission_uq"');
    expect(snapshot).toContain('"assignment_peer_review_tenant_assignment_fk"');
    expect(snapshot).toContain('"assignment_peer_review_tenant_submission_fk"');
    expect(snapshot).toContain('"assignment_peer_review_tenant_assignment_submission_fk"');
    expect(snapshot).toContain('"assignment_peer_review_status_check"');
    expect(snapshot).toContain('"public.gradebook_category"');
    expect(snapshot).toContain('"gradebook_category_tenant_course_position_uq"');
    expect(snapshot).toContain('"gradebook_category_tenant_course_fk"');
    expect(snapshot).toContain('"gradebook_category_weight_percent_range_check"');
    expect(snapshot).toContain('"gradebook_category_status_check"');
    expect(snapshot).toContain('"public.course_grading_scheme"');
    expect(snapshot).toContain('"course_grading_scheme_tenant_course_name_uq"');
    expect(snapshot).toContain('"course_grading_scheme_tenant_course_fk"');
    expect(snapshot).toContain('"course_grading_scheme_entries_nonempty_check"');
    expect(snapshot).toContain('"course_grading_scheme_status_check"');
    expect(snapshot).toContain('"public.assignment_override"');
    expect(snapshot).toContain('"assignment_override_tenant_assignment_target_uq"');
    expect(snapshot).toContain('"assignment_override_tenant_assignment_fk"');
    expect(snapshot).toContain('"assignment_override_target_type_check"');
    expect(snapshot).toContain('"assignment_override_status_check"');
    expect(snapshot).toContain('"assignment_override_availability_window_check"');
    expect(snapshot).toContain('"public.course_calendar_event"');
    expect(snapshot).toContain('"course_calendar_event_tenant_id_uq"');
    expect(snapshot).toContain('"course_calendar_event_tenant_course_fk"');
    expect(snapshot).toContain('"course_calendar_event_visibility_check"');
    expect(snapshot).toContain('"course_calendar_event_time_range_check"');
    expect(snapshot).toContain('"public.course_syllabus"');
    expect(snapshot).toContain('"course_syllabus_tenant_course_uq"');
    expect(snapshot).toContain('"course_syllabus_tenant_course_fk"');
    expect(snapshot).toContain('"course_syllabus_body_length_check"');
    expect(snapshot).toContain('"course_syllabus_visibility_check"');
    expect(snapshot).toContain('"course_syllabus_version_positive_check"');
    expect(snapshot).toContain('"public.course_external_tool"');
    expect(snapshot).toContain('"integration_connection_tenant_id_uq"');
    expect(snapshot).toContain('"course_external_tool_tenant_course_name_uq"');
    expect(snapshot).toContain('"course_external_tool_tenant_course_fk"');
    expect(snapshot).toContain('"course_external_tool_tenant_connection_fk"');
    expect(snapshot).toContain('"course_external_tool_description_length_check"');
    expect(snapshot).toContain('"course_external_tool_launch_url_https_check"');
    expect(snapshot).toContain('"course_external_tool_placement_check"');
    expect(snapshot).toContain('"course_external_tool_status_check"');
    expect(snapshot).toContain('"public.learning_objective_mastery"');
    expect(snapshot).toContain('"learning_objective_tenant_course_id_uq"');
    expect(snapshot).toContain('"learning_objective_mastery_tenant_course_objective_fk"');
    expect(snapshot).toContain('"learning_objective_mastery_score_pair_check"');
    expect(snapshot).toContain('"learning_objective_mastery_score_finite_check"');
    expect(snapshot).toContain('"public.assignment_gradebook_category"');
    expect(snapshot).toContain('"assignment_tenant_course_id_uq"');
    expect(snapshot).toContain('"gradebook_category_tenant_course_id_uq"');
    expect(snapshot).toContain('"assignment_gradebook_category_tenant_course_assignment_fk"');
    expect(snapshot).toContain('"assignment_gradebook_category_tenant_course_category_fk"');
    expect(snapshot).toContain('"public.gradebook_manual_item"');
    expect(snapshot).toContain('"gradebook_manual_item_tenant_course_position_uq"');
    expect(snapshot).toContain('"gradebook_manual_item_tenant_course_category_fk"');
    expect(snapshot).toContain('"gradebook_manual_item_max_score_finite_check"');
    expect(snapshot).toContain('"public.gradebook_manual_grade"');
    expect(snapshot).toContain('"gradebook_manual_grade_tenant_item_student_uq"');
    expect(snapshot).toContain('"gradebook_manual_grade_tenant_item_fk"');
    expect(snapshot).toContain('"gradebook_manual_grade_score_finite_check"');
    expect(snapshot).toContain('"public.notification_preference"');
    expect(snapshot).toContain('"notification_preference_tenant_user_category_channel_uq"');
    expect(snapshot).toContain('"notification_preference_frequency_check"');
    expect(snapshot).toContain('"course_module_tenant_course_id_uq"');
    expect(snapshot).toContain('"course_unit_tenant_course_id_uq"');
    expect(snapshot).toContain('"course_unit_tenant_course_module_id_uq"');
    expect(snapshot).toContain('"course_unit_tenant_module_id_uq"');
    expect(snapshot).toContain('"course_resource_unit_requires_module_check"');
    expect(snapshot).toContain('"course_resource_tenant_module_unit_fk"');
    expect(snapshot).toContain('"course_resource_position_nonnegative_check"');
    expect(snapshot).toContain('"assignment_unit_requires_module_check"');
    expect(snapshot).toContain('"assignment_position_nonnegative_check"');
    expect(snapshot).toContain('"assignment_tenant_module_unit_fk"');
    expect(snapshot).toContain('"quiz_unit_requires_module_check"');
    expect(snapshot).toContain('"quiz_position_nonnegative_check"');
    expect(snapshot).toContain('"quiz_tenant_module_unit_fk"');
    expect(snapshot).toContain('"public.quiz_attempt_response"');
    expect(snapshot).toContain('"quiz_attempt_tenant_quiz_id_uq"');
    expect(snapshot).toContain('"quiz_question_tenant_quiz_id_uq"');
    expect(snapshot).toContain('"quiz_attempt_response_tenant_attempt_question_uq"');
    expect(snapshot).toContain('"quiz_attempt_response_tenant_quiz_attempt_fk"');
    expect(snapshot).toContain('"quiz_attempt_response_tenant_quiz_question_fk"');
    expect(snapshot).toContain('"discussion_topic_unit_requires_module_check"');
    expect(snapshot).toContain('"discussion_topic_position_nonnegative_check"');
    expect(snapshot).toContain('"discussion_topic_tenant_module_unit_fk"');
    expect(snapshot).toContain('"ai_policy_rule_version_positive_check"');
  });
});
