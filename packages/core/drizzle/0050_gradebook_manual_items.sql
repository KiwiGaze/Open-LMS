CREATE TABLE "gradebook_manual_grade" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"gradebook_manual_item_id" text NOT NULL,
	"student_id" text NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"graded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gradebook_manual_grade_score_nonnegative_check" CHECK ("gradebook_manual_grade"."score" >= 0),
	CONSTRAINT "gradebook_manual_grade_max_score_positive_check" CHECK ("gradebook_manual_grade"."max_score" > 0),
	CONSTRAINT "gradebook_manual_grade_score_lte_max_score_check" CHECK ("gradebook_manual_grade"."score" <= "gradebook_manual_grade"."max_score"),
	CONSTRAINT "gradebook_manual_grade_score_finite_check" CHECK ("gradebook_manual_grade"."score"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND "gradebook_manual_grade"."max_score"::text NOT IN ('NaN', 'Infinity', '-Infinity')),
	CONSTRAINT "gradebook_manual_grade_status_check" CHECK ("gradebook_manual_grade"."status" IN ('draft', 'published', 'locked', 'appealed', 'revised')),
	CONSTRAINT "gradebook_manual_grade_source_check" CHECK ("gradebook_manual_grade"."source" IN ('manual', 'imported', 'ai_assisted_draft_reviewed_by_human'))
);
--> statement-breakpoint
CREATE TABLE "gradebook_manual_item" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"gradebook_category_id" text,
	"title" text NOT NULL,
	"description" text,
	"max_score" real NOT NULL,
	"due_at" timestamp with time zone,
	"position" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gradebook_manual_item_title_length_check" CHECK (length("gradebook_manual_item"."title") BETWEEN 1 AND 180),
	CONSTRAINT "gradebook_manual_item_description_length_check" CHECK ("gradebook_manual_item"."description" IS NULL OR length("gradebook_manual_item"."description") BETWEEN 1 AND 2000),
	CONSTRAINT "gradebook_manual_item_max_score_positive_check" CHECK ("gradebook_manual_item"."max_score" > 0),
	CONSTRAINT "gradebook_manual_item_max_score_finite_check" CHECK ("gradebook_manual_item"."max_score"::text NOT IN ('NaN', 'Infinity', '-Infinity')),
	CONSTRAINT "gradebook_manual_item_position_nonnegative_check" CHECK ("gradebook_manual_item"."position" >= 0),
	CONSTRAINT "gradebook_manual_item_status_check" CHECK ("gradebook_manual_item"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
ALTER TABLE "gradebook_manual_grade" ADD CONSTRAINT "gradebook_manual_grade_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_grade" ADD CONSTRAINT "gradebook_manual_grade_gradebook_manual_item_id_gradebook_manual_item_id_fk" FOREIGN KEY ("gradebook_manual_item_id") REFERENCES "public"."gradebook_manual_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_grade" ADD CONSTRAINT "gradebook_manual_grade_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_item" ADD CONSTRAINT "gradebook_manual_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_item" ADD CONSTRAINT "gradebook_manual_item_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_item" ADD CONSTRAINT "gradebook_manual_item_gradebook_category_id_gradebook_category_id_fk" FOREIGN KEY ("gradebook_category_id") REFERENCES "public"."gradebook_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_item" ADD CONSTRAINT "gradebook_manual_item_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_manual_item" ADD CONSTRAINT "gradebook_manual_item_tenant_course_category_fk" FOREIGN KEY ("tenant_id","course_id","gradebook_category_id") REFERENCES "public"."gradebook_category"("tenant_id","course_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_manual_grade_tenant_id_uq" ON "gradebook_manual_grade" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_manual_grade_tenant_item_student_uq" ON "gradebook_manual_grade" USING btree ("tenant_id","gradebook_manual_item_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_manual_item_tenant_id_uq" ON "gradebook_manual_item" USING btree ("tenant_id","id");--> statement-breakpoint
ALTER TABLE "gradebook_manual_grade" ADD CONSTRAINT "gradebook_manual_grade_tenant_item_fk" FOREIGN KEY ("tenant_id","gradebook_manual_item_id") REFERENCES "public"."gradebook_manual_item"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_manual_item_tenant_course_id_uq" ON "gradebook_manual_item" USING btree ("tenant_id","course_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_manual_item_tenant_course_position_uq" ON "gradebook_manual_item" USING btree ("tenant_id","course_id","position");
