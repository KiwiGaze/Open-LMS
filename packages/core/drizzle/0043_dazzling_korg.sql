CREATE TABLE "course_calendar_event" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"visibility" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_calendar_event_visibility_check" CHECK ("course_calendar_event"."visibility" IN ('draft', 'published', 'archived')),
	CONSTRAINT "course_calendar_event_time_range_check" CHECK ("course_calendar_event"."ends_at" IS NULL OR "course_calendar_event"."ends_at" > "course_calendar_event"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "course_calendar_event" ADD CONSTRAINT "course_calendar_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_calendar_event" ADD CONSTRAINT "course_calendar_event_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_calendar_event" ADD CONSTRAINT "course_calendar_event_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_calendar_event_tenant_id_uq" ON "course_calendar_event" USING btree ("tenant_id","id");