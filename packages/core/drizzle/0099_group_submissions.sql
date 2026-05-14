CREATE UNIQUE INDEX "course_group_set_tenant_course_id_uq" ON "course_group_set" ("tenant_id", "course_id", "id");

ALTER TABLE "assignment"
  ADD COLUMN "group_submission_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN "group_set_id" text;

ALTER TABLE "assignment"
  ADD CONSTRAINT "assignment_tenant_group_set_fk"
  FOREIGN KEY ("tenant_id", "course_id", "group_set_id") REFERENCES "course_group_set" ("tenant_id", "course_id", "id") ON DELETE restrict,
  ADD CONSTRAINT "assignment_group_submission_group_set_check"
  CHECK (("group_submission_enabled" = false AND "group_set_id" IS NULL) OR ("group_submission_enabled" = true AND "group_set_id" IS NOT NULL));

ALTER TABLE "submission"
  ADD COLUMN "group_id" text;

ALTER TABLE "submission"
  ADD CONSTRAINT "submission_tenant_group_fk"
  FOREIGN KEY ("tenant_id", "group_id") REFERENCES "course_group" ("tenant_id", "id") ON DELETE set null;

CREATE UNIQUE INDEX "submission_tenant_assignment_group_version_uq"
  ON "submission" ("tenant_id", "assignment_id", "group_id", "version")
  WHERE "group_id" IS NOT NULL;
