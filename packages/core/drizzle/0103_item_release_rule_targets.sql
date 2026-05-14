ALTER TABLE "course_module_release_rule" ADD COLUMN "target_type" text DEFAULT 'module' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD COLUMN "target_id" text;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_target_type_check" CHECK ("course_module_release_rule"."target_type" IN ('module', 'course_page', 'course_resource', 'assignment'));--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_target_id_check" CHECK (("course_module_release_rule"."target_type" = 'module' AND "course_module_release_rule"."target_id" IS NULL) OR ("course_module_release_rule"."target_type" <> 'module' AND "course_module_release_rule"."target_id" IS NOT NULL));
