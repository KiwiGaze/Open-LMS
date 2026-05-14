ALTER TABLE "ai_feedback_draft" ADD COLUMN "ai_generation_log_id" text DEFAULT 'legacy-untracked' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD COLUMN "prompt_identifier" text DEFAULT 'legacy-untracked' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD COLUMN "prompt_version" text DEFAULT 'legacy-untracked' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD COLUMN "provider_type" text DEFAULT 'legacy-untracked' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ADD COLUMN "model" text DEFAULT 'legacy-untracked' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ALTER COLUMN "ai_generation_log_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ALTER COLUMN "prompt_identifier" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ALTER COLUMN "prompt_version" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ALTER COLUMN "provider_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_feedback_draft" ALTER COLUMN "model" DROP DEFAULT;
