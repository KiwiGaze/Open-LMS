CREATE UNIQUE INDEX "course_tenant_id_uq" ON "course" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_tenant_id_uq" ON "course_module" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_unit_tenant_id_uq" ON "course_unit" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_resource_tenant_id_uq" ON "course_resource" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_objective_tenant_id_uq" ON "learning_objective" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_page_tenant_id_uq" ON "course_page" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "rubric_tenant_id_uq" ON "rubric" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_tenant_id_uq" ON "assignment" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_tenant_id_uq" ON "draft" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_job_tenant_id_uq" ON "ai_job" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "file_resource_tenant_id_uq" ON "file_resource" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "human_review_tenant_ai_feedback_draft_uq" ON "human_review" USING btree ("tenant_id","ai_feedback_draft_id");--> statement-breakpoint
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_unit_fk" FOREIGN KEY ("tenant_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objective" ADD CONSTRAINT "learning_objective_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_page" ADD CONSTRAINT "course_page_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tenant_active_rubric_fk" FOREIGN KEY ("tenant_id","active_rubric_id") REFERENCES "public"."rubric"("tenant_id","id") ON DELETE SET NULL ("active_rubric_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft" ADD CONSTRAINT "draft_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_tenant_source_draft_fk" FOREIGN KEY ("tenant_id","source_draft_id") REFERENCES "public"."draft"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_precheck" ADD CONSTRAINT "submission_precheck_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_precheck" ADD CONSTRAINT "submission_precheck_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_explanation" ADD CONSTRAINT "page_explanation_tenant_course_page_fk" FOREIGN KEY ("tenant_id","course_page_id") REFERENCES "public"."course_page"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_explanation" ADD CONSTRAINT "page_explanation_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_trend_card" ADD CONSTRAINT "assignment_trend_card_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_trend_card" ADD CONSTRAINT "assignment_trend_card_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_clarity_review" ADD CONSTRAINT "rubric_clarity_review_tenant_rubric_fk" FOREIGN KEY ("tenant_id","rubric_id") REFERENCES "public"."rubric"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_clarity_review" ADD CONSTRAINT "rubric_clarity_review_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_tenant_context_package_fk" FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_membership" ADD CONSTRAINT "course_membership_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rag_chunk" ADD CONSTRAINT "rag_chunk_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_tenant_storage_file_fk" FOREIGN KEY ("tenant_id","storage_file_id") REFERENCES "public"."file_resource"("tenant_id","id") ON UPDATE no action;
