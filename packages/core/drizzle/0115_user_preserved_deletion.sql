ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_status_check" CHECK ("status" IN ('active', 'deleted'));--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_deleted_at_status_check" CHECK (("status" = 'active' AND "deleted_at" IS NULL) OR ("status" = 'deleted' AND "deleted_at" IS NOT NULL));
