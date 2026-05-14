ALTER TABLE "course_resource" DROP CONSTRAINT "course_resource_tenant_module_fk";--> statement-breakpoint
ALTER TABLE "course_resource" DROP CONSTRAINT "course_resource_tenant_unit_fk";--> statement-breakpoint
ALTER TABLE "published_feedback" DROP CONSTRAINT "published_feedback_tenant_human_review_fk";--> statement-breakpoint
ALTER TABLE "published_feedback" DROP CONSTRAINT "published_feedback_tenant_linked_grade_fk";--> statement-breakpoint
ALTER TABLE "published_feedback" DROP CONSTRAINT "published_feedback_tenant_linked_grade_submission_fk";--> statement-breakpoint
ALTER TABLE "export_job" DROP CONSTRAINT "export_job_tenant_storage_file_fk";--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_human_review_fk" FOREIGN KEY ("tenant_id","human_review_id") REFERENCES "public"."human_review"("tenant_id","id") ON DELETE SET NULL ("human_review_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_linked_grade_fk" FOREIGN KEY ("tenant_id","linked_grade_id") REFERENCES "public"."grade"("tenant_id","id") ON DELETE SET NULL ("linked_grade_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_feedback" ADD CONSTRAINT "published_feedback_tenant_linked_grade_submission_fk" FOREIGN KEY ("tenant_id","linked_grade_id","submission_id") REFERENCES "public"."grade"("tenant_id","id","submission_id") ON DELETE SET NULL ("linked_grade_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_tenant_storage_file_fk" FOREIGN KEY ("tenant_id","storage_file_id") REFERENCES "public"."file_resource"("tenant_id","id") ON DELETE SET NULL ("storage_file_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_score_nonnegative_check" CHECK ("grade"."score" >= 0);--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_max_score_positive_check" CHECK ("grade"."max_score" > 0);--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_score_lte_max_score_check" CHECK ("grade"."score" <= "grade"."max_score");
