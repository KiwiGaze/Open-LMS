ALTER TABLE "ai_generation_log" ADD COLUMN "prompt_identifier" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_generation_log" ADD COLUMN "prompt_version" text NOT NULL;