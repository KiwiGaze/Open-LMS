CREATE TABLE "feedback_dialogue" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"published_feedback_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"status" text NOT NULL,
	"opened_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_dialogue_status_check" CHECK ("status" IN ('open', 'closed'))
);

CREATE TABLE "feedback_dialogue_message" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"dialogue_id" text NOT NULL,
	"author_role" text NOT NULL,
	"author_id" text,
	"criterion_id" text,
	"body" text NOT NULL,
	"context_package_id" text,
	"ai_generation_log_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_dialogue_message_author_role_check" CHECK ("author_role" IN ('student', 'instructor', 'ai')),
	CONSTRAINT "feedback_dialogue_message_body_length_check" CHECK (length("body") BETWEEN 1 AND 10000)
);

ALTER TABLE "feedback_dialogue"
ADD CONSTRAINT "feedback_dialogue_tenant_published_feedback_fk"
FOREIGN KEY ("tenant_id","published_feedback_id") REFERENCES "public"."published_feedback"("tenant_id","id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "feedback_dialogue"
ADD CONSTRAINT "feedback_dialogue_tenant_submission_fk"
FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "feedback_dialogue"
ADD CONSTRAINT "feedback_dialogue_tenant_published_feedback_submission_fk"
FOREIGN KEY ("tenant_id","published_feedback_id","submission_id")
REFERENCES "public"."published_feedback"("tenant_id","id","submission_id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "feedback_dialogue_message"
ADD CONSTRAINT "feedback_dialogue_message_tenant_dialogue_fk"
FOREIGN KEY ("tenant_id","dialogue_id") REFERENCES "public"."feedback_dialogue"("tenant_id","id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "feedback_dialogue_message"
ADD CONSTRAINT "feedback_dialogue_message_tenant_context_package_fk"
FOREIGN KEY ("tenant_id","context_package_id") REFERENCES "public"."context_package"("tenant_id","id")
ON DELETE restrict ON UPDATE no action;

ALTER TABLE "feedback_dialogue_message"
ADD CONSTRAINT "feedback_dialogue_message_tenant_ai_generation_log_fk"
FOREIGN KEY ("tenant_id","ai_generation_log_id") REFERENCES "public"."ai_generation_log"("tenant_id","id")
ON DELETE restrict ON UPDATE no action;

CREATE UNIQUE INDEX "published_feedback_tenant_id_submission_uq"
ON "published_feedback" USING btree ("tenant_id","id","submission_id");

CREATE UNIQUE INDEX "feedback_dialogue_tenant_id_uq"
ON "feedback_dialogue" USING btree ("tenant_id","id");

CREATE UNIQUE INDEX "feedback_dialogue_tenant_published_feedback_uq"
ON "feedback_dialogue" USING btree ("tenant_id","published_feedback_id");

CREATE UNIQUE INDEX "feedback_dialogue_message_tenant_id_uq"
ON "feedback_dialogue_message" USING btree ("tenant_id","id");
