CREATE TABLE "ai_generation_log" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"actor_id" text,
	"action_identifier" text NOT NULL,
	"context_package_id" text NOT NULL,
	"provider_type" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"retry_count" integer NOT NULL,
	"fallback_used" boolean DEFAULT false NOT NULL,
	"estimated_cost_cents" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"instructions" text NOT NULL,
	"status" text NOT NULL,
	"due_at" timestamp with time zone,
	"allow_resubmission" boolean DEFAULT false NOT NULL,
	"active_rubric_id" text,
	"ai_settings" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"active_tenant_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"actor_id" text,
	"category" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_event" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"topic" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "consent" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"action_type" text NOT NULL,
	"scope" text NOT NULL,
	"scope_id" text NOT NULL,
	"state" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"evidence" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_consent_policy" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"default_posture" text NOT NULL,
	"jurisdiction_profile" text NOT NULL,
	"age_gate_enabled" integer DEFAULT 0 NOT NULL,
	"reconsent_triggers" jsonb NOT NULL,
	"min_n_for_disclosure" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_package" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"action_identifier" text NOT NULL,
	"actor_id" text NOT NULL,
	"resources" jsonb NOT NULL,
	"policy_stamp" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_feedback_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"context_package_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text NOT NULL,
	"criterion_feedback" jsonb NOT NULL,
	"overall_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_review" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"ai_feedback_draft_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"decision" text NOT NULL,
	"edited_criterion_feedback" jsonb NOT NULL,
	"edited_overall_comment" text,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"source" text NOT NULL,
	"human_review_id" text,
	"criterion_feedback" jsonb NOT NULL,
	"overall_comment" text,
	"linked_grade_id" text,
	"version" integer NOT NULL,
	"published_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_membership" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_config" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"provider_type" text NOT NULL,
	"base_url" text,
	"encrypted_api_key" text NOT NULL,
	"model_preferences" jsonb NOT NULL,
	"capabilities" jsonb NOT NULL,
	"quota" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_precheck" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"context_package_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubric" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"version" integer NOT NULL,
	"source_template_id" text,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubric_template" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"owner" text NOT NULL,
	"title" text NOT NULL,
	"discipline_tags" jsonb NOT NULL,
	"assignment_type_tags" jsonb NOT NULL,
	"locale_tags" jsonb NOT NULL,
	"criteria" jsonb NOT NULL,
	"quality_score" real NOT NULL,
	"example_feedback_fragments" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubric_clarity_review" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"rubric_id" text NOT NULL,
	"context_package_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"blocks" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"source_draft_id" text NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"content_snapshot" jsonb NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "assignment_trend_card" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"context_package_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generation_log" ADD CONSTRAINT "ai_generation_log_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_log" ADD CONSTRAINT "ai_generation_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_log" ADD CONSTRAINT "ai_generation_log_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_active_rubric_id_rubric_id_fk" FOREIGN KEY ("active_rubric_id") REFERENCES "public"."rubric"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_event" ADD CONSTRAINT "outbox_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_subject_id_user_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_consent_policy" ADD CONSTRAINT "institution_consent_policy_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_package" ADD CONSTRAINT "context_package_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_package" ADD CONSTRAINT "context_package_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD CONSTRAINT "ai_feedback_draft_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD CONSTRAINT "ai_feedback_draft_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD CONSTRAINT "ai_feedback_draft_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_review" ADD CONSTRAINT "human_review_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_review" ADD CONSTRAINT "human_review_ai_feedback_draft_id_ai_feedback_draft_id_fk" FOREIGN KEY ("ai_feedback_draft_id") REFERENCES "public"."ai_feedback_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_review" ADD CONSTRAINT "human_review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_human_review_id_human_review_id_fk" FOREIGN KEY ("human_review_id") REFERENCES "public"."human_review"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_linked_grade_id_grade_id_fk" FOREIGN KEY ("linked_grade_id") REFERENCES "public"."grade"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_membership" ADD CONSTRAINT "tenant_membership_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_membership" ADD CONSTRAINT "tenant_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_config" ADD CONSTRAINT "provider_config_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_precheck" ADD CONSTRAINT "submission_precheck_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_precheck" ADD CONSTRAINT "submission_precheck_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_precheck" ADD CONSTRAINT "submission_precheck_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric" ADD CONSTRAINT "rubric_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric" ADD CONSTRAINT "rubric_source_template_id_rubric_template_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."rubric_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_clarity_review" ADD CONSTRAINT "rubric_clarity_review_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_clarity_review" ADD CONSTRAINT "rubric_clarity_review_rubric_id_rubric_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubric"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_clarity_review" ADD CONSTRAINT "rubric_clarity_review_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft" ADD CONSTRAINT "draft_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft" ADD CONSTRAINT "draft_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft" ADD CONSTRAINT "draft_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_source_draft_id_draft_id_fk" FOREIGN KEY ("source_draft_id") REFERENCES "public"."draft"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_trend_card" ADD CONSTRAINT "assignment_trend_card_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_trend_card" ADD CONSTRAINT "assignment_trend_card_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_trend_card" ADD CONSTRAINT "assignment_trend_card_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_feedback_draft_tenant_idempotency_uq" ON "ai_feedback_draft" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "published_feedback_human_review_id_uq" ON "published_feedback" USING btree ("human_review_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_membership_tenant_user_role_uq" ON "tenant_membership" USING btree ("tenant_id","user_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_config_tenant_id_uq" ON "provider_config" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_precheck_tenant_idempotency_uq" ON "submission_precheck" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "rubric_clarity_review_tenant_idempotency_uq" ON "rubric_clarity_review" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_trend_card_tenant_idempotency_uq" ON "assignment_trend_card" USING btree ("tenant_id","idempotency_key");