CREATE TABLE "course_syllabus" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"body" text NOT NULL,
	"visibility" text NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_syllabus_body_length_check" CHECK (length("course_syllabus"."body") > 0),
	CONSTRAINT "course_syllabus_visibility_check" CHECK ("course_syllabus"."visibility" IN ('draft', 'published', 'archived')),
	CONSTRAINT "course_syllabus_version_positive_check" CHECK ("course_syllabus"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "course_syllabus" ADD CONSTRAINT "course_syllabus_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_syllabus" ADD CONSTRAINT "course_syllabus_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_syllabus" ADD CONSTRAINT "course_syllabus_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_syllabus_tenant_id_uq" ON "course_syllabus" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_syllabus_tenant_course_uq" ON "course_syllabus" USING btree ("tenant_id","course_id");