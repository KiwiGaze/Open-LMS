ALTER TABLE "ai_policy_rule" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "ai_policy_rule" ALTER COLUMN "version" DROP DEFAULT;
