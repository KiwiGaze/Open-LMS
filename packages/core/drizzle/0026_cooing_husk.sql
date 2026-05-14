CREATE TABLE "quiz" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"time_limit_minutes" integer,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"max_attempts" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_time_limit_minutes_positive_check" CHECK ("quiz"."time_limit_minutes" IS NULL OR "quiz"."time_limit_minutes" > 0),
	CONSTRAINT "quiz_max_attempts_positive_check" CHECK ("quiz"."max_attempts" > 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_question" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"position" integer NOT NULL,
	"question_type" text NOT NULL,
	"prompt" text NOT NULL,
	"points" integer NOT NULL,
	"choices" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_question_position_nonnegative_check" CHECK ("quiz_question"."position" >= 0),
	CONSTRAINT "quiz_question_points_nonnegative_check" CHECK ("quiz_question"."points" >= 0)
);
--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_tenant_quiz_fk" FOREIGN KEY ("tenant_id","quiz_id") REFERENCES "public"."quiz"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_tenant_id_uq" ON "quiz" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_question_tenant_id_uq" ON "quiz_question" USING btree ("tenant_id","id");