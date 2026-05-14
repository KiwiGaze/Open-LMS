CREATE TABLE "assignment_peer_review" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"status" text NOT NULL,
	"due_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_peer_review_status_check" CHECK ("assignment_peer_review"."status" IN ('assigned', 'submitted', 'completed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_tenant_assignment_id_uq" ON "submission" USING btree ("tenant_id","assignment_id","id");--> statement-breakpoint
ALTER TABLE "assignment_peer_review" ADD CONSTRAINT "assignment_peer_review_tenant_assignment_submission_fk" FOREIGN KEY ("tenant_id","assignment_id","submission_id") REFERENCES "public"."submission"("tenant_id","assignment_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_peer_review_tenant_id_uq" ON "assignment_peer_review" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_peer_review_tenant_assignment_reviewer_submission_uq" ON "assignment_peer_review" USING btree ("tenant_id","assignment_id","reviewer_id","submission_id");
