CREATE TABLE "submission_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"visibility" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_comment_body_length_check" CHECK (length("submission_comment"."body") BETWEEN 1 AND 4000),
	CONSTRAINT "submission_comment_visibility_check" CHECK ("submission_comment"."visibility" IN ('student_visible', 'staff_only'))
);
--> statement-breakpoint
ALTER TABLE "submission_comment" ADD CONSTRAINT "submission_comment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_comment" ADD CONSTRAINT "submission_comment_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_comment" ADD CONSTRAINT "submission_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_comment" ADD CONSTRAINT "submission_comment_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_comment_tenant_id_uq" ON "submission_comment" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE INDEX "submission_comment_tenant_submission_created_idx" ON "submission_comment" USING btree ("tenant_id","submission_id","created_at","id");
