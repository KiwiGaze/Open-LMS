CREATE TABLE "course_section_member" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"section_id" text NOT NULL,
	"student_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_section_member" ADD CONSTRAINT "course_section_member_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_member" ADD CONSTRAINT "course_section_member_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_member" ADD CONSTRAINT "course_section_member_section_id_course_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_member" ADD CONSTRAINT "course_section_member_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_member" ADD CONSTRAINT "course_section_member_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_member" ADD CONSTRAINT "course_section_member_tenant_section_fk" FOREIGN KEY ("tenant_id","section_id") REFERENCES "public"."course_section"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_section_member_tenant_id_uq" ON "course_section_member" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_section_member_tenant_section_student_uq" ON "course_section_member" USING btree ("tenant_id","section_id","student_id");
