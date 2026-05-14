CREATE TABLE "quiz_override" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "quiz_id" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "opens_at" timestamp with time zone,
  "closes_at" timestamp with time zone,
  "time_limit_minutes" integer,
  "max_attempts" integer,
  "status" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "quiz_override_target_type_check" CHECK ("target_type" IN ('user', 'group', 'section')),
  CONSTRAINT "quiz_override_target_id_length_check" CHECK (length("target_id") > 0),
  CONSTRAINT "quiz_override_status_check" CHECK ("status" IN ('active', 'archived')),
  CONSTRAINT "quiz_override_availability_window_check" CHECK ("opens_at" IS NULL OR "closes_at" IS NULL OR "closes_at" > "opens_at"),
  CONSTRAINT "quiz_override_time_limit_minutes_positive_check" CHECK ("time_limit_minutes" IS NULL OR "time_limit_minutes" > 0),
  CONSTRAINT "quiz_override_max_attempts_positive_check" CHECK ("max_attempts" IS NULL OR "max_attempts" > 0)
);

CREATE UNIQUE INDEX "quiz_override_tenant_id_uq"
  ON "quiz_override" ("tenant_id", "id");

CREATE UNIQUE INDEX "quiz_override_tenant_quiz_target_uq"
  ON "quiz_override" ("tenant_id", "quiz_id", "target_type", "target_id");

ALTER TABLE "quiz_override"
  ADD CONSTRAINT "quiz_override_tenant_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_override_quiz_fk"
  FOREIGN KEY ("quiz_id") REFERENCES "quiz" ("id") ON DELETE cascade,
  ADD CONSTRAINT "quiz_override_tenant_quiz_fk"
  FOREIGN KEY ("tenant_id", "quiz_id") REFERENCES "quiz" ("tenant_id", "id") ON DELETE cascade;
