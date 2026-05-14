CREATE TABLE "quiz_attempt_response" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"answer" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempt_tenant_quiz_id_uq" ON "quiz_attempt" USING btree ("tenant_id","quiz_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_question_tenant_quiz_id_uq" ON "quiz_question" USING btree ("tenant_id","quiz_id","id");--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_attempt_id_quiz_attempt_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_question_id_quiz_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_tenant_attempt_fk" FOREIGN KEY ("tenant_id","attempt_id") REFERENCES "public"."quiz_attempt"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_tenant_question_fk" FOREIGN KEY ("tenant_id","question_id") REFERENCES "public"."quiz_question"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_tenant_quiz_attempt_fk" FOREIGN KEY ("tenant_id","quiz_id","attempt_id") REFERENCES "public"."quiz_attempt"("tenant_id","quiz_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_response" ADD CONSTRAINT "quiz_attempt_response_tenant_quiz_question_fk" FOREIGN KEY ("tenant_id","quiz_id","question_id") REFERENCES "public"."quiz_question"("tenant_id","quiz_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempt_response_tenant_id_uq" ON "quiz_attempt_response" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempt_response_tenant_attempt_question_uq" ON "quiz_attempt_response" USING btree ("tenant_id","attempt_id","question_id");
