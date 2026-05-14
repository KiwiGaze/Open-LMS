CREATE TABLE "survey_response" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"survey_id" text NOT NULL,
	"survey_question_id" text NOT NULL,
	"respondent_id" text,
	"answer" jsonb NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_survey_id_survey_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."survey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_survey_question_id_survey_question_id_fk" FOREIGN KEY ("survey_question_id") REFERENCES "public"."survey_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_respondent_id_user_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_tenant_survey_fk" FOREIGN KEY ("tenant_id","survey_id") REFERENCES "public"."survey"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_tenant_question_fk" FOREIGN KEY ("tenant_id","survey_question_id") REFERENCES "public"."survey_question"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "survey_response_tenant_id_uq" ON "survey_response" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_response_tenant_question_respondent_uq" ON "survey_response" USING btree ("tenant_id","survey_question_id","respondent_id");