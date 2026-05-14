DROP INDEX "ai_feedback_draft_tenant_idempotency_uq";--> statement-breakpoint
DROP INDEX "page_explanation_tenant_idempotency_uq";--> statement-breakpoint
DROP INDEX "submission_precheck_tenant_idempotency_uq";--> statement-breakpoint
DROP INDEX "rubric_clarity_review_tenant_idempotency_uq";--> statement-breakpoint
DROP INDEX "assignment_trend_card_tenant_idempotency_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "ai_generation_log_tenant_id_uq" ON "ai_generation_log" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "context_package_tenant_id_uq" ON "context_package" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_feedback_draft_tenant_id_uq" ON "ai_feedback_draft" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_tenant_id_uq" ON "grade" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_tenant_submission_uq" ON "grade" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_tenant_id_submission_uq" ON "grade" USING btree ("tenant_id","id","submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "human_review_tenant_id_uq" ON "human_review" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "published_feedback_tenant_id_uq" ON "published_feedback" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "published_feedback_tenant_submission_version_uq" ON "published_feedback" USING btree ("tenant_id","submission_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_tenant_id_uq" ON "submission" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_tenant_assignment_student_version_uq" ON "submission" USING btree ("tenant_id","assignment_id","student_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_feedback_draft_tenant_idempotency_uq" ON "ai_feedback_draft" USING btree ("tenant_id","submission_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "page_explanation_tenant_idempotency_uq" ON "page_explanation" USING btree ("tenant_id","course_page_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_precheck_tenant_idempotency_uq" ON "submission_precheck" USING btree ("tenant_id","submission_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "rubric_clarity_review_tenant_idempotency_uq" ON "rubric_clarity_review" USING btree ("tenant_id","rubric_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_trend_card_tenant_idempotency_uq" ON "assignment_trend_card" USING btree ("tenant_id","assignment_id","idempotency_key");--> statement-breakpoint
INSERT INTO "ai_generation_log" (
  "id",
  "tenant_id",
  "actor_id",
  "action_identifier",
  "context_package_id",
  "prompt_identifier",
  "prompt_version",
  "provider_type",
  "model",
  "input_tokens",
  "output_tokens",
  "duration_ms",
  "retry_count",
  "fallback_used"
)
SELECT
  "id",
  "tenant_id",
  NULL,
  'legacy_untracked',
  "context_package_id",
  "prompt_identifier",
  "prompt_version",
  "provider_type",
  "model",
  0,
  0,
  0,
  0,
  false
FROM "ai_feedback_draft"
WHERE "ai_generation_log_id" = 'legacy-untracked'
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "ai_feedback_draft"
SET "ai_generation_log_id" = "id"
WHERE "ai_generation_log_id" = 'legacy-untracked';--> statement-breakpoint
ALTER TABLE "ai_generation_log" ADD CONSTRAINT "ai_generation_log_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD CONSTRAINT "ai_feedback_draft_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD CONSTRAINT "ai_feedback_draft_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD CONSTRAINT "ai_feedback_draft_tenant_ai_generation_log_fk" FOREIGN KEY ("tenant_id","ai_generation_log_id") REFERENCES "public"."ai_generation_log"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_review" ADD CONSTRAINT "human_review_tenant_ai_feedback_draft_fk" FOREIGN KEY ("tenant_id","ai_feedback_draft_id") REFERENCES "public"."ai_feedback_draft"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_human_review_fk" FOREIGN KEY ("tenant_id","human_review_id") REFERENCES "public"."human_review"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_linked_grade_fk" FOREIGN KEY ("tenant_id","linked_grade_id") REFERENCES "public"."grade"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_linked_grade_submission_fk" FOREIGN KEY ("tenant_id","linked_grade_id","submission_id") REFERENCES "public"."grade"("tenant_id","id","submission_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_lifecycle_state_check" CHECK ((
        ("consent"."state" = 'granted' AND "consent"."granted_by" IS NOT NULL AND "consent"."granted_at" IS NOT NULL AND "consent"."revoked_at" IS NULL)
        OR ("consent"."state" = 'revoked' AND "consent"."revoked_at" IS NOT NULL)
        OR ("consent"."state" = 'pending' AND "consent"."granted_by" IS NULL AND "consent"."granted_at" IS NULL AND "consent"."revoked_at" IS NULL)
        OR ("consent"."state" = 'expired' AND "consent"."expires_at" IS NOT NULL AND "consent"."revoked_at" IS NULL)
      ));
