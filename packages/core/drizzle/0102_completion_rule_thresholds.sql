ALTER TABLE "completion_requirement"
  ADD COLUMN "module_id" text,
  ADD COLUMN "min_score_percent" real;

ALTER TABLE "completion_requirement"
  ADD CONSTRAINT "completion_requirement_tenant_module_fk"
  FOREIGN KEY ("tenant_id", "module_id") REFERENCES "course_module" ("tenant_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "completion_requirement_tenant_course_module_fk"
  FOREIGN KEY ("tenant_id", "course_id", "module_id") REFERENCES "course_module" ("tenant_id", "course_id", "id") ON DELETE cascade,
  ADD CONSTRAINT "completion_requirement_type_check"
  CHECK ("requirement_type" IN ('view_resource', 'submit_assignment', 'pass_quiz', 'manual')),
  ADD CONSTRAINT "completion_requirement_target_type_check"
  CHECK ("target_type" IN ('course_resource', 'assignment', 'quiz', 'manual')),
  ADD CONSTRAINT "completion_requirement_min_score_percent_range_check"
  CHECK ("min_score_percent" IS NULL OR ("min_score_percent" >= 0 AND "min_score_percent" <= 100)),
  ADD CONSTRAINT "completion_requirement_min_score_percent_type_check"
  CHECK ("min_score_percent" IS NULL OR "requirement_type" = 'pass_quiz'),
  ADD CONSTRAINT "completion_requirement_pass_quiz_target_check"
  CHECK ("requirement_type" <> 'pass_quiz' OR ("target_type" = 'quiz' AND "target_id" IS NOT NULL)),
  ADD CONSTRAINT "completion_requirement_manual_target_check"
  CHECK ("requirement_type" <> 'manual' OR ("target_type" = 'manual' AND "target_id" IS NULL));
