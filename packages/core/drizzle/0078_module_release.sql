CREATE TABLE "course_module_release_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"rule_type" text NOT NULL,
	"config" jsonb NOT NULL,
	"position" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_module_release_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"combinator" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_module_release_override" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"student_id" text NOT NULL,
	"state" text NOT NULL,
	"reason" text,
	"granted_by_user_id" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_rule_type_check" CHECK ("course_module_release_rule"."rule_type" IN ('prerequisite_modules', 'objective_mastery', 'date_after', 'manual_unlock'));--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_status_check" CHECK ("course_module_release_rule"."status" IN ('active', 'archived'));--> statement-breakpoint
ALTER TABLE "course_module_release_rule" ADD CONSTRAINT "course_module_release_rule_position_nonnegative_check" CHECK ("course_module_release_rule"."position" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_rule_tenant_id_uq" ON "course_module_release_rule" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_rule_tenant_module_id_uq" ON "course_module_release_rule" USING btree ("tenant_id","module_id","id");--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_policy" ADD CONSTRAINT "course_module_release_policy_combinator_check" CHECK ("course_module_release_policy"."combinator" IN ('all', 'any'));--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_policy_tenant_id_uq" ON "course_module_release_policy" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_policy_tenant_module_uq" ON "course_module_release_policy" USING btree ("tenant_id","module_id");--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_tenant_module_fk" FOREIGN KEY ("tenant_id","module_id") REFERENCES "public"."course_module"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module_release_override" ADD CONSTRAINT "course_module_release_override_state_check" CHECK ("course_module_release_override"."state" IN ('unlocked', 'locked'));--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_override_tenant_id_uq" ON "course_module_release_override" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_module_release_override_tenant_module_student_uq" ON "course_module_release_override" USING btree ("tenant_id","module_id","student_id");
