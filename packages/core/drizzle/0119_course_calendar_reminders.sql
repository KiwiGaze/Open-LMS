CREATE UNIQUE INDEX "course_calendar_event_tenant_course_id_uq" ON "course_calendar_event" ("tenant_id","course_id","id");--> statement-breakpoint
CREATE TABLE "course_calendar_event_reminder" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "course_id" text NOT NULL,
  "event_id" text NOT NULL,
  "offset_minutes" integer NOT NULL,
  "remind_at" timestamp with time zone NOT NULL,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "course_calendar_event_reminder_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
  CONSTRAINT "course_calendar_event_reminder_course_fk" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE cascade,
  CONSTRAINT "course_calendar_event_reminder_event_fk" FOREIGN KEY ("event_id") REFERENCES "course_calendar_event"("id") ON DELETE cascade,
  CONSTRAINT "course_calendar_event_reminder_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "course"("tenant_id","id") ON DELETE cascade,
  CONSTRAINT "course_calendar_event_reminder_tenant_event_fk" FOREIGN KEY ("tenant_id","event_id") REFERENCES "course_calendar_event"("tenant_id","id") ON DELETE cascade,
  CONSTRAINT "course_calendar_event_reminder_tenant_course_event_fk" FOREIGN KEY ("tenant_id","course_id","event_id") REFERENCES "course_calendar_event"("tenant_id","course_id","id") ON DELETE cascade,
  CONSTRAINT "course_calendar_event_reminder_offset_minutes_check" CHECK ("offset_minutes" BETWEEN 1 AND 10080)
);--> statement-breakpoint
CREATE UNIQUE INDEX "course_calendar_event_reminder_tenant_id_uq" ON "course_calendar_event_reminder" ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_calendar_event_reminder_pending_uq" ON "course_calendar_event_reminder" ("tenant_id","event_id","offset_minutes") WHERE "sent_at" IS NULL;--> statement-breakpoint
ALTER TABLE "notification_preference" DROP CONSTRAINT "notification_preference_category_check";--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_category_check" CHECK ("category" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'announcement_published', 'discussion_reply', 'calendar_reminder', 'system'));
