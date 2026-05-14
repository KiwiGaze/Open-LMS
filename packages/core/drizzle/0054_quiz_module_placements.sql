ALTER TABLE "quiz" ADD COLUMN "module_id" text;--> statement-breakpoint
ALTER TABLE "quiz" ADD COLUMN "unit_id" text;--> statement-breakpoint
ALTER TABLE "quiz" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_unit_id_course_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_unit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tenant_module_fk" FOREIGN KEY ("tenant_id","course_id","module_id") REFERENCES "public"."course_module"("tenant_id","course_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tenant_unit_fk" FOREIGN KEY ("tenant_id","course_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","course_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","module_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_unit_requires_module_check" CHECK ("quiz"."unit_id" IS NULL OR "quiz"."module_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_position_nonnegative_check" CHECK ("quiz"."position" IS NULL OR "quiz"."position" >= 0);
