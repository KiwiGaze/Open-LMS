CREATE TABLE "assignment_peer_review_response" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"peer_review_id" text NOT NULL,
	"criterion_id" text NOT NULL,
	"score" real,
	"comment" text,
	"status" text NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment_peer_review_response" ADD CONSTRAINT "assignment_peer_review_response_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review_response" ADD CONSTRAINT "assignment_peer_review_response_peer_review_id_assignment_peer_review_id_fk" FOREIGN KEY ("peer_review_id") REFERENCES "public"."assignment_peer_review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review_response" ADD CONSTRAINT "assignment_peer_review_response_tenant_review_fk" FOREIGN KEY ("tenant_id","peer_review_id") REFERENCES "public"."assignment_peer_review"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_review_response" ADD CONSTRAINT "assignment_peer_review_response_status_check" CHECK ("assignment_peer_review_response"."status" IN ('draft', 'submitted'));--> statement-breakpoint
ALTER TABLE "assignment_peer_review_response" ADD CONSTRAINT "assignment_peer_review_response_score_range_check" CHECK ("assignment_peer_review_response"."score" IS NULL OR "assignment_peer_review_response"."score" >= 0);--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_peer_review_response_tenant_id_uq" ON "assignment_peer_review_response" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_peer_review_response_tenant_review_criterion_uq" ON "assignment_peer_review_response" USING btree ("tenant_id","peer_review_id","criterion_id");
