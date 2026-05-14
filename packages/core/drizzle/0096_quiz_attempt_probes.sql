CREATE TABLE "quiz_attempt_probe" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"learning_objective_id" text NOT NULL,
	"source_question_bank_question_id" text,
	"position" integer NOT NULL,
	"difficulty_target" real NOT NULL,
	"prompt" text NOT NULL,
	"render_model" jsonb NOT NULL,
	"points" integer NOT NULL,
	"answer_key" jsonb,
	"ai_generation_log_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_attempt_probe_position_nonnegative_check" CHECK ("position" >= 0),
	CONSTRAINT "quiz_attempt_probe_difficulty_target_range_check" CHECK ("difficulty_target" >= 0 AND "difficulty_target" <= 1),
	CONSTRAINT "quiz_attempt_probe_points_nonnegative_check" CHECK ("points" >= 0)
);

CREATE TABLE "quiz_attempt_probe_response" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"probe_id" text NOT NULL,
	"answer" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "quiz_attempt_probe"
ADD CONSTRAINT "quiz_attempt_probe_tenant_quiz_attempt_fk"
FOREIGN KEY ("tenant_id","quiz_id","attempt_id") REFERENCES "public"."quiz_attempt"("tenant_id","quiz_id","id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "quiz_attempt_probe"
ADD CONSTRAINT "quiz_attempt_probe_tenant_learning_objective_fk"
FOREIGN KEY ("tenant_id","learning_objective_id") REFERENCES "public"."learning_objective"("tenant_id","id")
ON DELETE restrict ON UPDATE no action;

ALTER TABLE "quiz_attempt_probe"
ADD CONSTRAINT "quiz_attempt_probe_tenant_source_question_bank_question_fk"
FOREIGN KEY ("tenant_id","source_question_bank_question_id") REFERENCES "public"."question_bank_question"("tenant_id","id")
ON DELETE set null ON UPDATE no action;

ALTER TABLE "quiz_attempt_probe_response"
ADD CONSTRAINT "quiz_attempt_probe_response_tenant_quiz_attempt_fk"
FOREIGN KEY ("tenant_id","quiz_id","attempt_id") REFERENCES "public"."quiz_attempt"("tenant_id","quiz_id","id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "quiz_attempt_probe_response"
ADD CONSTRAINT "quiz_attempt_probe_response_tenant_quiz_attempt_probe_fk"
FOREIGN KEY ("tenant_id","quiz_id","attempt_id","probe_id")
REFERENCES "public"."quiz_attempt_probe"("tenant_id","quiz_id","attempt_id","id")
ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "quiz_attempt_probe_tenant_id_uq"
ON "quiz_attempt_probe" USING btree ("tenant_id","id");

CREATE UNIQUE INDEX "quiz_attempt_probe_tenant_quiz_attempt_id_uq"
ON "quiz_attempt_probe" USING btree ("tenant_id","quiz_id","attempt_id","id");

CREATE UNIQUE INDEX "quiz_attempt_probe_tenant_attempt_position_uq"
ON "quiz_attempt_probe" USING btree ("tenant_id","attempt_id","position");

CREATE UNIQUE INDEX "quiz_attempt_probe_response_tenant_id_uq"
ON "quiz_attempt_probe_response" USING btree ("tenant_id","id");

CREATE UNIQUE INDEX "quiz_attempt_probe_response_tenant_attempt_probe_uq"
ON "quiz_attempt_probe_response" USING btree ("tenant_id","attempt_id","probe_id");
