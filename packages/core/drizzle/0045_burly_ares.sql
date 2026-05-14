CREATE TABLE "course_grading_scheme" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"entries" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_grading_scheme_name_length_check" CHECK (length("course_grading_scheme"."name") BETWEEN 1 AND 180),
	CONSTRAINT "course_grading_scheme_status_check" CHECK ("course_grading_scheme"."status" IN ('active', 'archived')),
	CONSTRAINT "course_grading_scheme_entries_nonempty_check" CHECK (jsonb_typeof("course_grading_scheme"."entries") = 'array' AND jsonb_array_length("course_grading_scheme"."entries") > 0)
);
--> statement-breakpoint
ALTER TABLE "course_grading_scheme" ADD CONSTRAINT "course_grading_scheme_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grading_scheme" ADD CONSTRAINT "course_grading_scheme_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grading_scheme" ADD CONSTRAINT "course_grading_scheme_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_grading_scheme_tenant_id_uq" ON "course_grading_scheme" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_grading_scheme_tenant_course_name_uq" ON "course_grading_scheme" USING btree ("tenant_id","course_id","name");