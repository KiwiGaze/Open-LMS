CREATE TABLE "quiz_attempt_question_grade" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "quiz_id" text NOT NULL,
  "attempt_id" text NOT NULL,
  "question_id" text NOT NULL,
  "grader_id" text NOT NULL,
  "score" integer NOT NULL,
  "feedback" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "quiz_attempt_question_grade_score_nonnegative_check" CHECK ("score" >= 0),
  CONSTRAINT "quiz_attempt_question_grade_feedback_length_check" CHECK ("feedback" IS NULL OR char_length("feedback") BETWEEN 1 AND 4000)
);

CREATE UNIQUE INDEX "quiz_attempt_question_grade_tenant_id_uq"
  ON "quiz_attempt_question_grade" ("tenant_id", "id");

CREATE UNIQUE INDEX "quiz_attempt_question_grade_tenant_attempt_question_uq"
  ON "quiz_attempt_question_grade" ("tenant_id", "attempt_id", "question_id");

ALTER TABLE "quiz_attempt_question_grade"
  ADD CONSTRAINT "quiz_attempt_question_grade_tenant_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_attempt_question_grade_quiz_fk"
  FOREIGN KEY ("quiz_id") REFERENCES "quiz" ("id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_attempt_question_grade_attempt_fk"
  FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempt" ("id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_attempt_question_grade_question_fk"
  FOREIGN KEY ("question_id") REFERENCES "quiz_question" ("id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_attempt_question_grade_grader_fk"
  FOREIGN KEY ("grader_id") REFERENCES "user" ("id") ON DELETE restrict,
  ADD CONSTRAINT "quiz_attempt_question_grade_tenant_quiz_attempt_fk"
  FOREIGN KEY ("tenant_id", "quiz_id", "attempt_id") REFERENCES "quiz_attempt" ("tenant_id", "quiz_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_attempt_question_grade_tenant_quiz_question_fk"
  FOREIGN KEY ("tenant_id", "quiz_id", "question_id") REFERENCES "quiz_question" ("tenant_id", "quiz_id", "id") ON DELETE cascade;
