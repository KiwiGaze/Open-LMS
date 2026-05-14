ALTER TABLE "assignment" ADD COLUMN "module_id" text;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "unit_id" text;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "position" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_tenant_course_id_uq" ON "course_module" USING btree ("tenant_id","course_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_unit_tenant_course_id_uq" ON "course_unit" USING btree ("tenant_id","course_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_unit_tenant_course_module_id_uq" ON "course_unit" USING btree ("tenant_id","course_id","module_id","id");--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_unit_id_course_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_unit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tenant_module_fk" FOREIGN KEY ("tenant_id","course_id","module_id") REFERENCES "public"."course_module"("tenant_id","course_id","id") ON DELETE SET NULL ("module_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tenant_unit_fk" FOREIGN KEY ("tenant_id","course_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","id") ON DELETE SET NULL ("unit_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","course_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","course_id","module_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_unit_requires_module_check" CHECK ("assignment"."unit_id" IS NULL OR "assignment"."module_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_position_nonnegative_check" CHECK ("assignment"."position" IS NULL OR "assignment"."position" >= 0);
