ALTER TABLE "user" ADD COLUMN "retain_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_retain_until_status_check" CHECK ("status" = 'deleted' OR "retain_until" IS NULL);--> statement-breakpoint
CREATE TABLE "retention_policy" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "target_type" text NOT NULL,
  "retain_days" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "retention_policy_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
  CONSTRAINT "retention_policy_target_type_check" CHECK ("target_type" IN ('deleted_user')),
  CONSTRAINT "retention_policy_retain_days_check" CHECK ("retain_days" >= 0 AND "retain_days" <= 3650)
);--> statement-breakpoint
CREATE UNIQUE INDEX "retention_policy_tenant_target_uq" ON "retention_policy" ("tenant_id","target_type");
