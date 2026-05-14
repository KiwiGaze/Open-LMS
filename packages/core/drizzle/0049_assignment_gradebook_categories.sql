CREATE TABLE "assignment_gradebook_category" (
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"gradebook_category_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment_gradebook_category" ADD CONSTRAINT "assignment_gradebook_category_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_gradebook_category" ADD CONSTRAINT "assignment_gradebook_category_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_gradebook_category" ADD CONSTRAINT "assignment_gradebook_category_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_gradebook_category" ADD CONSTRAINT "assignment_gradebook_category_gradebook_category_id_gradebook_category_id_fk" FOREIGN KEY ("gradebook_category_id") REFERENCES "public"."gradebook_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_tenant_course_id_uq" ON "assignment" USING btree ("tenant_id","course_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_category_tenant_course_id_uq" ON "gradebook_category" USING btree ("tenant_id","course_id","id");--> statement-breakpoint
ALTER TABLE "assignment_gradebook_category" ADD CONSTRAINT "assignment_gradebook_category_tenant_course_assignment_fk" FOREIGN KEY ("tenant_id","course_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_gradebook_category" ADD CONSTRAINT "assignment_gradebook_category_tenant_course_category_fk" FOREIGN KEY ("tenant_id","course_id","gradebook_category_id") REFERENCES "public"."gradebook_category"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_gradebook_category_tenant_assignment_uq" ON "assignment_gradebook_category" USING btree ("tenant_id","assignment_id");
