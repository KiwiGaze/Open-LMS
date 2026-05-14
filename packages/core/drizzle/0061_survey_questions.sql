CREATE TABLE "survey_question" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"survey_id" text NOT NULL,
	"position" integer NOT NULL,
	"question_type" text NOT NULL,
	"prompt" text NOT NULL,
	"required" boolean NOT NULL,
	"choices" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_question_position_nonnegative_check" CHECK ("survey_question"."position" >= 0),
	CONSTRAINT "survey_question_question_type_check" CHECK ("survey_question"."question_type" IN ('single_choice', 'multi_choice', 'free_text', 'rating_scale'))
);
--> statement-breakpoint
ALTER TABLE "survey_question" ADD CONSTRAINT "survey_question_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_question" ADD CONSTRAINT "survey_question_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."survey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_question" ADD CONSTRAINT "survey_question_tenant_survey_fk" FOREIGN KEY ("tenant_id","survey_id") REFERENCES "public"."survey"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "survey_question_tenant_id_uq" ON "survey_question" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_question_tenant_survey_position_uq" ON "survey_question" USING btree ("tenant_id","survey_id","position");