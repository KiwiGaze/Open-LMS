ALTER TABLE "discussion_topic" ADD COLUMN "grading_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD COLUMN "points_possible" real;--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD COLUMN "rubric_id" text;--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD CONSTRAINT "discussion_topic_rubric_id_rubric_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubric"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD CONSTRAINT "discussion_topic_points_possible_check" CHECK ("discussion_topic"."points_possible" IS NULL OR "discussion_topic"."points_possible" >= 0);--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD CONSTRAINT "discussion_topic_grading_consistency_check" CHECK ("discussion_topic"."grading_enabled" = false OR "discussion_topic"."points_possible" IS NOT NULL);--> statement-breakpoint
CREATE TABLE "discussion_post_grade" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"post_id" text NOT NULL,
	"student_id" text NOT NULL,
	"score" real NOT NULL,
	"max_score" real NOT NULL,
	"status" text NOT NULL,
	"comment" text,
	"graded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_topic_id_discussion_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."discussion_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_post_id_discussion_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."discussion_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_graded_by_user_id_user_id_fk" FOREIGN KEY ("graded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_tenant_topic_fk" FOREIGN KEY ("tenant_id","topic_id") REFERENCES "public"."discussion_topic"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_tenant_post_fk" FOREIGN KEY ("tenant_id","post_id") REFERENCES "public"."discussion_post"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_status_check" CHECK ("discussion_post_grade"."status" IN ('draft', 'published', 'revised'));--> statement-breakpoint
ALTER TABLE "discussion_post_grade" ADD CONSTRAINT "discussion_post_grade_score_bounds_check" CHECK ("discussion_post_grade"."score" >= 0 AND "discussion_post_grade"."max_score" > 0 AND "discussion_post_grade"."score" <= "discussion_post_grade"."max_score");--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_post_grade_tenant_id_uq" ON "discussion_post_grade" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_post_grade_tenant_post_uq" ON "discussion_post_grade" USING btree ("tenant_id","post_id");
