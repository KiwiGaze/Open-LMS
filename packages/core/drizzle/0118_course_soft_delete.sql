ALTER TABLE "course" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_status_check" CHECK ("status" IN ('draft', 'active', 'archived', 'deleted'));--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_deleted_at_status_check" CHECK (("status" = 'deleted' AND "deleted_at" IS NOT NULL) OR ("status" <> 'deleted' AND "deleted_at" IS NULL));
