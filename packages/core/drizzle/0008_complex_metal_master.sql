DROP INDEX "ai_policy_rule_tenant_action_uq";--> statement-breakpoint
ALTER TABLE "ai_policy_rule" ADD COLUMN "target_type" text;--> statement-breakpoint
ALTER TABLE "ai_policy_rule" ADD COLUMN "target_id" text;--> statement-breakpoint
UPDATE "ai_policy_rule" SET "target_type" = 'tenant', "target_id" = "tenant_id" WHERE "target_type" IS NULL;--> statement-breakpoint
ALTER TABLE "ai_policy_rule" ALTER COLUMN "target_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_policy_rule" ALTER COLUMN "target_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_policy_rule_tenant_action_target_uq" ON "ai_policy_rule" USING btree ("tenant_id","action_identifier","target_type","target_id");
