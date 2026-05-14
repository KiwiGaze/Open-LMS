CREATE TABLE "course_meeting" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"provider" text NOT NULL,
	"external_url" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_meeting_provider_check" CHECK ("course_meeting"."provider" IN ('bbb', 'zoom', 'teams', 'google_meet', 'other')),
	CONSTRAINT "course_meeting_status_check" CHECK ("course_meeting"."status" IN ('scheduled', 'in_progress', 'ended', 'cancelled')),
	CONSTRAINT "course_meeting_time_range_check" CHECK ("course_meeting"."ends_at" IS NULL OR "course_meeting"."ends_at" > "course_meeting"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "course_meeting" ADD CONSTRAINT "course_meeting_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meeting" ADD CONSTRAINT "course_meeting_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meeting" ADD CONSTRAINT "course_meeting_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_meeting_tenant_id_uq" ON "course_meeting" USING btree ("tenant_id","id");