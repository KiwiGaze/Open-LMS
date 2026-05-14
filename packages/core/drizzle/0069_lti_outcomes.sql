CREATE TABLE "course_external_tool_outcome" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"external_tool_id" text NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"status" text NOT NULL,
	"reported_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_external_tool_outcome_status_check" CHECK ("course_external_tool_outcome"."status" IN ('pending', 'published', 'rejected')),
	CONSTRAINT "course_external_tool_outcome_score_range_check" CHECK ("course_external_tool_outcome"."score" >= 0 AND "course_external_tool_outcome"."score" <= "course_external_tool_outcome"."max_score"),
	CONSTRAINT "course_external_tool_outcome_max_score_positive_check" CHECK ("course_external_tool_outcome"."max_score" > 0)
);
--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_external_tool_id_fk" FOREIGN KEY ("external_tool_id") REFERENCES "public"."course_external_tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool_outcome" ADD CONSTRAINT "course_external_tool_outcome_tenant_external_tool_fk" FOREIGN KEY ("tenant_id","external_tool_id") REFERENCES "public"."course_external_tool"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_external_tool_outcome_tenant_id_uq" ON "course_external_tool_outcome" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_external_tool_outcome_unique_per_tuple_uq" ON "course_external_tool_outcome" USING btree ("tenant_id","assignment_id","student_id","external_tool_id");
