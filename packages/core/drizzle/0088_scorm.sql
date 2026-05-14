CREATE TABLE "scorm_package" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"scorm_version" text NOT NULL,
	"launch_url" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"scorm_package_id" text NOT NULL,
	"student_id" text NOT NULL,
	"completion_status" text NOT NULL,
	"success_status" text NOT NULL,
	"score_scaled" real,
	"total_time_seconds" real,
	"suspend_data" text,
	"last_visited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scorm_package" ADD CONSTRAINT "scorm_package_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_package" ADD CONSTRAINT "scorm_package_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_package" ADD CONSTRAINT "scorm_package_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_package" ADD CONSTRAINT "scorm_package_scorm_version_check" CHECK ("scorm_package"."scorm_version" IN ('1.2', '2004'));--> statement-breakpoint
ALTER TABLE "scorm_package" ADD CONSTRAINT "scorm_package_status_check" CHECK ("scorm_package"."status" IN ('draft', 'published', 'archived'));--> statement-breakpoint
ALTER TABLE "scorm_package" ADD CONSTRAINT "scorm_package_launch_url_https_check" CHECK (lower("scorm_package"."launch_url") LIKE 'https://%');--> statement-breakpoint
CREATE UNIQUE INDEX "scorm_package_tenant_id_uq" ON "scorm_package" USING btree ("tenant_id","id");--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_scorm_package_id_scorm_package_id_fk" FOREIGN KEY ("scorm_package_id") REFERENCES "public"."scorm_package"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_tenant_package_fk" FOREIGN KEY ("tenant_id","scorm_package_id") REFERENCES "public"."scorm_package"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_completion_status_check" CHECK ("scorm_attempt"."completion_status" IN ('not_attempted', 'incomplete', 'completed'));--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_success_status_check" CHECK ("scorm_attempt"."success_status" IN ('unknown', 'passed', 'failed'));--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_score_scaled_range_check" CHECK ("scorm_attempt"."score_scaled" IS NULL OR ("scorm_attempt"."score_scaled" >= 0 AND "scorm_attempt"."score_scaled" <= 1));--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_total_time_nonnegative_check" CHECK ("scorm_attempt"."total_time_seconds" IS NULL OR "scorm_attempt"."total_time_seconds" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "scorm_attempt_tenant_id_uq" ON "scorm_attempt" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorm_attempt_tenant_package_student_uq" ON "scorm_attempt" USING btree ("tenant_id","scorm_package_id","student_id");
