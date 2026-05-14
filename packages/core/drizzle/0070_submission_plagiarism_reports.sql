CREATE TABLE "submission_plagiarism_report" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"integration_connection_id" text NOT NULL,
	"similarity_percent" real NOT NULL,
	"report_url" text,
	"status" text NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_plagiarism_report_status_check" CHECK ("submission_plagiarism_report"."status" IN ('pending', 'complete', 'failed')),
	CONSTRAINT "submission_plagiarism_report_similarity_range_check" CHECK ("submission_plagiarism_report"."similarity_percent" >= 0 AND "submission_plagiarism_report"."similarity_percent" <= 100),
	CONSTRAINT "submission_plagiarism_report_url_format_check" CHECK ("submission_plagiarism_report"."report_url" IS NULL OR lower("submission_plagiarism_report"."report_url") LIKE 'https://%')
);
--> statement-breakpoint
ALTER TABLE "submission_plagiarism_report" ADD CONSTRAINT "submission_plagiarism_report_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_plagiarism_report" ADD CONSTRAINT "submission_plagiarism_report_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_plagiarism_report" ADD CONSTRAINT "submission_plagiarism_report_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_plagiarism_report" ADD CONSTRAINT "submission_plagiarism_report_integration_connection_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_plagiarism_report" ADD CONSTRAINT "submission_plagiarism_report_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_plagiarism_report" ADD CONSTRAINT "submission_plagiarism_report_tenant_connection_fk" FOREIGN KEY ("tenant_id","integration_connection_id") REFERENCES "public"."integration_connection"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_plagiarism_report_tenant_id_uq" ON "submission_plagiarism_report" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_plagiarism_report_per_provider_uq" ON "submission_plagiarism_report" USING btree ("tenant_id","submission_id","integration_connection_id");
