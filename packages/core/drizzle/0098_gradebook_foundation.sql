CREATE TABLE "grade_history" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "grade_id" text NOT NULL,
  "submission_id" text NOT NULL,
  "actor_id" text,
  "previous_score" real,
  "previous_max_score" real,
  "previous_status" text,
  "previous_source" text,
  "score" real NOT NULL,
  "max_score" real NOT NULL,
  "status" text NOT NULL,
  "source" text NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "grade_appeal" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "grade_id" text NOT NULL,
  "submission_id" text NOT NULL,
  "student_id" text NOT NULL,
  "status" text NOT NULL,
  "reason" text NOT NULL,
  "resolution" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone
);

ALTER TABLE "grade_history"
  ADD CONSTRAINT "grade_history_tenant_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE cascade,
  ADD CONSTRAINT "grade_history_grade_id_fk"
  FOREIGN KEY ("grade_id") REFERENCES "grade" ("id") ON DELETE cascade,
  ADD CONSTRAINT "grade_history_submission_id_fk"
  FOREIGN KEY ("submission_id") REFERENCES "submission" ("id") ON DELETE cascade,
  ADD CONSTRAINT "grade_history_actor_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "user" ("id") ON DELETE set null,
  ADD CONSTRAINT "grade_history_tenant_grade_fk"
  FOREIGN KEY ("tenant_id", "grade_id") REFERENCES "grade" ("tenant_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "grade_history_tenant_submission_fk"
  FOREIGN KEY ("tenant_id", "submission_id") REFERENCES "submission" ("tenant_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "grade_history_score_nonnegative_check" CHECK ("score" >= 0),
  ADD CONSTRAINT "grade_history_max_score_positive_check" CHECK ("max_score" > 0),
  ADD CONSTRAINT "grade_history_score_lte_max_score_check" CHECK ("score" <= "max_score"),
  ADD CONSTRAINT "grade_history_previous_fields_all_or_none_check"
    CHECK (("previous_score" IS NULL AND "previous_max_score" IS NULL AND "previous_status" IS NULL AND "previous_source" IS NULL) OR ("previous_score" IS NOT NULL AND "previous_max_score" IS NOT NULL AND "previous_status" IS NOT NULL AND "previous_source" IS NOT NULL)),
  ADD CONSTRAINT "grade_history_previous_score_lte_max_score_check"
    CHECK ("previous_score" IS NULL OR "previous_score" <= "previous_max_score"),
  ADD CONSTRAINT "grade_history_status_check"
    CHECK ("status" IN ('draft', 'published', 'locked', 'appealed', 'revised')),
  ADD CONSTRAINT "grade_history_source_check"
    CHECK ("source" IN ('manual', 'imported', 'ai_assisted_draft_reviewed_by_human')),
  ADD CONSTRAINT "grade_history_previous_status_check"
    CHECK ("previous_status" IS NULL OR "previous_status" IN ('draft', 'published', 'locked', 'appealed', 'revised')),
  ADD CONSTRAINT "grade_history_previous_source_check"
    CHECK ("previous_source" IS NULL OR "previous_source" IN ('manual', 'imported', 'ai_assisted_draft_reviewed_by_human')),
  ADD CONSTRAINT "grade_history_reason_length_check"
    CHECK ("reason" IS NULL OR length("reason") BETWEEN 1 AND 2000);

ALTER TABLE "grade_appeal"
  ADD CONSTRAINT "grade_appeal_tenant_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE cascade,
  ADD CONSTRAINT "grade_appeal_grade_id_fk"
  FOREIGN KEY ("grade_id") REFERENCES "grade" ("id") ON DELETE cascade,
  ADD CONSTRAINT "grade_appeal_submission_id_fk"
  FOREIGN KEY ("submission_id") REFERENCES "submission" ("id") ON DELETE cascade,
  ADD CONSTRAINT "grade_appeal_student_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "user" ("id") ON DELETE restrict,
  ADD CONSTRAINT "grade_appeal_tenant_grade_fk"
  FOREIGN KEY ("tenant_id", "grade_id") REFERENCES "grade" ("tenant_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "grade_appeal_tenant_submission_fk"
  FOREIGN KEY ("tenant_id", "submission_id") REFERENCES "submission" ("tenant_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "grade_appeal_tenant_grade_submission_fk"
  FOREIGN KEY ("tenant_id", "grade_id", "submission_id") REFERENCES "grade" ("tenant_id", "id", "submission_id") ON DELETE cascade,
  ADD CONSTRAINT "grade_appeal_status_check"
    CHECK ("status" IN ('open', 'under_review', 'resolved', 'rejected', 'cancelled')),
  ADD CONSTRAINT "grade_appeal_reason_length_check"
    CHECK (length("reason") BETWEEN 1 AND 4000),
  ADD CONSTRAINT "grade_appeal_resolution_length_check"
    CHECK ("resolution" IS NULL OR length("resolution") BETWEEN 1 AND 4000),
  ADD CONSTRAINT "grade_appeal_resolution_status_check"
    CHECK (("status" IN ('resolved', 'rejected') AND "resolution" IS NOT NULL AND "resolved_at" IS NOT NULL) OR ("status" NOT IN ('resolved', 'rejected') AND "resolved_at" IS NULL));

CREATE UNIQUE INDEX "grade_history_tenant_id_uq" ON "grade_history" ("tenant_id", "id");
CREATE UNIQUE INDEX "grade_history_tenant_submission_created_id_uq" ON "grade_history" ("tenant_id", "submission_id", "created_at", "id");
CREATE UNIQUE INDEX "grade_appeal_tenant_id_uq" ON "grade_appeal" ("tenant_id", "id");
CREATE UNIQUE INDEX "grade_appeal_tenant_grade_student_open_uq" ON "grade_appeal" ("tenant_id", "grade_id", "student_id") WHERE "status" IN ('open', 'under_review');
