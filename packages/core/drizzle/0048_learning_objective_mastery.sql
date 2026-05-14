CREATE TABLE "learning_objective_mastery" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"learning_objective_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text NOT NULL,
	"score" real,
	"max_score" real,
	"last_assessed_at" timestamp with time zone,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_objective_mastery_status_check" CHECK ("learning_objective_mastery"."status" IN ('not_assessed', 'developing', 'proficient', 'mastered')),
	CONSTRAINT "learning_objective_mastery_evidence_count_nonnegative_check" CHECK ("learning_objective_mastery"."evidence_count" >= 0),
	CONSTRAINT "learning_objective_mastery_score_pair_check" CHECK ((("learning_objective_mastery"."score" IS NULL AND "learning_objective_mastery"."max_score" IS NULL) OR ("learning_objective_mastery"."score" IS NOT NULL AND "learning_objective_mastery"."max_score" IS NOT NULL))),
	CONSTRAINT "learning_objective_mastery_score_bounds_check" CHECK ("learning_objective_mastery"."score" IS NULL OR ("learning_objective_mastery"."score" >= 0 AND "learning_objective_mastery"."max_score" > 0 AND "learning_objective_mastery"."score" <= "learning_objective_mastery"."max_score")),
	CONSTRAINT "learning_objective_mastery_score_finite_check" CHECK (("learning_objective_mastery"."score" IS NULL OR "learning_objective_mastery"."score"::text NOT IN ('NaN', 'Infinity', '-Infinity')) AND ("learning_objective_mastery"."max_score" IS NULL OR "learning_objective_mastery"."max_score"::text NOT IN ('NaN', 'Infinity', '-Infinity')))
);
--> statement-breakpoint
ALTER TABLE "learning_objective_mastery" ADD CONSTRAINT "learning_objective_mastery_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objective_mastery" ADD CONSTRAINT "learning_objective_mastery_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objective_mastery" ADD CONSTRAINT "learning_objective_mastery_learning_objective_id_learning_objective_id_fk" FOREIGN KEY ("learning_objective_id") REFERENCES "public"."learning_objective"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objective_mastery" ADD CONSTRAINT "learning_objective_mastery_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_objective_tenant_course_id_uq" ON "learning_objective" USING btree ("tenant_id","course_id","id");--> statement-breakpoint
ALTER TABLE "learning_objective_mastery" ADD CONSTRAINT "learning_objective_mastery_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objective_mastery" ADD CONSTRAINT "learning_objective_mastery_tenant_course_objective_fk" FOREIGN KEY ("tenant_id","course_id","learning_objective_id") REFERENCES "public"."learning_objective"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_objective_mastery_tenant_id_uq" ON "learning_objective_mastery" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_objective_mastery_tenant_course_objective_student_uq" ON "learning_objective_mastery" USING btree ("tenant_id","course_id","learning_objective_id","student_id");
