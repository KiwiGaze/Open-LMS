ALTER TABLE "course_section" ADD COLUMN "meeting_days" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_section" ADD COLUMN "meeting_start_time" text;
--> statement-breakpoint
ALTER TABLE "course_section" ADD COLUMN "meeting_end_time" text;
--> statement-breakpoint
ALTER TABLE "course_section" ADD COLUMN "location" text;
--> statement-breakpoint
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_meeting_days_array_check" CHECK (jsonb_typeof("meeting_days") = 'array');
--> statement-breakpoint
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_meeting_time_pair_check" CHECK (CASE WHEN jsonb_typeof("meeting_days") = 'array' THEN ((jsonb_array_length("meeting_days") = 0 AND "meeting_start_time" IS NULL AND "meeting_end_time" IS NULL) OR (jsonb_array_length("meeting_days") > 0 AND "meeting_start_time" IS NOT NULL AND "meeting_end_time" IS NOT NULL)) ELSE false END);
--> statement-breakpoint
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_meeting_start_time_format_check" CHECK ("meeting_start_time" IS NULL OR "meeting_start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
--> statement-breakpoint
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_meeting_end_time_format_check" CHECK ("meeting_end_time" IS NULL OR "meeting_end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
--> statement-breakpoint
ALTER TABLE "course_section" ADD CONSTRAINT "course_section_meeting_time_order_check" CHECK ("meeting_start_time" IS NULL OR "meeting_end_time" IS NULL OR "meeting_end_time" > "meeting_start_time");
