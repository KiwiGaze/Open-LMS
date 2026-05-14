CREATE TABLE "question_bank" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_bank_status_check" CHECK ("question_bank"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "question_bank_question" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"question_bank_id" text NOT NULL,
	"position" integer NOT NULL,
	"question_type" text NOT NULL,
	"prompt" text NOT NULL,
	"points" integer NOT NULL,
	"choices" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_bank_question_position_nonnegative_check" CHECK ("question_bank_question"."position" >= 0),
	CONSTRAINT "question_bank_question_points_nonnegative_check" CHECK ("question_bank_question"."points" >= 0)
);
--> statement-breakpoint
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank_question" ADD CONSTRAINT "question_bank_question_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank_question" ADD CONSTRAINT "question_bank_question_question_bank_id_question_bank_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."question_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_bank_tenant_id_uq" ON "question_bank" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE INDEX "question_bank_tenant_course_status_title_idx" ON "question_bank" USING btree ("tenant_id","course_id","status","title");--> statement-breakpoint
ALTER TABLE "question_bank_question" ADD CONSTRAINT "question_bank_question_tenant_bank_fk" FOREIGN KEY ("tenant_id","question_bank_id") REFERENCES "public"."question_bank"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_bank_question_tenant_id_uq" ON "question_bank_question" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_bank_question_tenant_bank_position_uq" ON "question_bank_question" USING btree ("tenant_id","question_bank_id","position");
