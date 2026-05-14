CREATE TABLE "quiz_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"student_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_attempt_attempt_number_positive_check" CHECK ("quiz_attempt"."attempt_number" > 0),
	CONSTRAINT "quiz_attempt_score_nonnegative_check" CHECK ("quiz_attempt"."score" IS NULL OR "quiz_attempt"."score" >= 0)
);
--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_tenant_quiz_fk" FOREIGN KEY ("tenant_id","quiz_id") REFERENCES "public"."quiz"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempt_tenant_id_uq" ON "quiz_attempt" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_attempt_tenant_quiz_student_attempt_uq" ON "quiz_attempt" USING btree ("tenant_id","quiz_id","student_id","attempt_number");