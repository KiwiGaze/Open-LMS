ALTER TABLE "course"
  ADD COLUMN "max_enrollments" integer,
  ADD COLUMN "waitlist_enabled" boolean DEFAULT false NOT NULL;

ALTER TABLE "course"
  ADD CONSTRAINT "course_max_enrollments_positive_check"
  CHECK ("max_enrollments" IS NULL OR "max_enrollments" > 0);

ALTER TABLE "course_membership"
  ADD COLUMN "status" text DEFAULT 'active' NOT NULL,
  ADD COLUMN "invited_at" timestamp with time zone,
  ADD COLUMN "accepted_at" timestamp with time zone,
  ADD COLUMN "dropped_at" timestamp with time zone,
  ADD COLUMN "withdrawn_at" timestamp with time zone;

UPDATE "course_membership"
SET "accepted_at" = "created_at"
WHERE "status" = 'active' AND "accepted_at" IS NULL;

ALTER TABLE "file_resource"
  ADD COLUMN "course_id" text,
  ADD COLUMN "alt_text" text,
  ADD COLUMN "transcript_text" text,
  ADD COLUMN "license" text,
  ADD COLUMN "copyright_holder" text;

ALTER TABLE "file_resource"
  ADD CONSTRAINT "file_resource_tenant_course_fk"
  FOREIGN KEY ("tenant_id", "course_id")
  REFERENCES "course" ("tenant_id", "id")
  ON DELETE SET NULL;
