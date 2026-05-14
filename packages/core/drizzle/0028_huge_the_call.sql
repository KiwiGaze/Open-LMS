CREATE TABLE "completion_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"requirement_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "completion_requirement" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"requirement_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"status" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "completion_requirement_position_nonnegative_check" CHECK ("completion_requirement"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "completion_progress" ADD CONSTRAINT "completion_progress_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_progress" ADD CONSTRAINT "completion_progress_requirement_id_completion_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."completion_requirement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_progress" ADD CONSTRAINT "completion_progress_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_progress" ADD CONSTRAINT "completion_progress_tenant_requirement_fk" FOREIGN KEY ("tenant_id","requirement_id") REFERENCES "public"."completion_requirement"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_requirement" ADD CONSTRAINT "completion_requirement_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_requirement" ADD CONSTRAINT "completion_requirement_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_requirement" ADD CONSTRAINT "completion_requirement_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "completion_progress_tenant_id_uq" ON "completion_progress" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "completion_progress_tenant_requirement_student_uq" ON "completion_progress" USING btree ("tenant_id","requirement_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "completion_requirement_tenant_id_uq" ON "completion_requirement" USING btree ("tenant_id","id");