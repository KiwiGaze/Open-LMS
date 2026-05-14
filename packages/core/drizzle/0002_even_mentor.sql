CREATE TABLE "ai_policy_rule" (
	"tenant_id" text NOT NULL,
	"action_identifier" text NOT NULL,
	"enabled" integer NOT NULL,
	"risk_level" text NOT NULL,
	"scope" text NOT NULL,
	"requires_human_review" integer NOT NULL,
	"requires_explicit_consent" integer NOT NULL,
	"min_cohort_size_for_disclosure" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_policy_rule" ADD CONSTRAINT "ai_policy_rule_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_policy_rule_tenant_action_uq" ON "ai_policy_rule" USING btree ("tenant_id","action_identifier");