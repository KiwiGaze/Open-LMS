UPDATE "ai_policy_rule" SET "version" = 1 WHERE "version" < 1;--> statement-breakpoint
ALTER TABLE "ai_policy_rule" ADD CONSTRAINT "ai_policy_rule_version_positive_check" CHECK ("version" > 0);
