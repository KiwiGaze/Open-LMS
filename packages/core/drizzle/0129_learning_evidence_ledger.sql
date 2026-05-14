CREATE TABLE "learning_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"objective_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_attempt" integer,
	"source_observed_at" timestamp with time zone NOT NULL,
	"signal" text NOT NULL,
	"score" real,
	"max_score" real,
	"confidence" real NOT NULL,
	"misconception_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_text" text NOT NULL,
	"provenance" jsonb NOT NULL,
	"context" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_evidence_source_type_check" CHECK ("source_type" IN ('assignment_submission', 'quiz_attempt', 'discussion_post', 'support_conversation', 'instructor_observation')),
	CONSTRAINT "learning_evidence_signal_check" CHECK ("signal" IN ('attempt', 'revision', 'misconception', 'explanation', 'mastery_observation')),
	CONSTRAINT "learning_evidence_confidence_range_check" CHECK ("confidence" >= 0 AND "confidence" <= 1),
	CONSTRAINT "learning_evidence_score_pair_check" CHECK ((("score" IS NULL AND "max_score" IS NULL) OR ("score" IS NOT NULL AND "max_score" IS NOT NULL))),
	CONSTRAINT "learning_evidence_score_bounds_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "max_score" > 0 AND "score" <= "max_score")),
	CONSTRAINT "learning_evidence_source_attempt_positive_check" CHECK ("source_attempt" IS NULL OR "source_attempt" > 0),
	CONSTRAINT "learning_evidence_misconception_ids_array_check" CHECK (jsonb_typeof("misconception_ids") = 'array')
);
--> statement-breakpoint
ALTER TABLE "learning_evidence" ADD CONSTRAINT "learning_evidence_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence" ADD CONSTRAINT "learning_evidence_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence" ADD CONSTRAINT "learning_evidence_student_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence" ADD CONSTRAINT "learning_evidence_tenant_course_objective_fk" FOREIGN KEY ("tenant_id","course_id","objective_id") REFERENCES "public"."learning_objective"("tenant_id","course_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_evidence_tenant_id_uq" ON "learning_evidence" USING btree ("tenant_id","id");
