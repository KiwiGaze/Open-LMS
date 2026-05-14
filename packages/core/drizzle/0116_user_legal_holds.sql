CREATE TABLE "user_legal_hold" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "user_id" text NOT NULL,
  "created_by_id" text,
  "reason" text NOT NULL,
  "released_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "user_legal_hold_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
  CONSTRAINT "user_legal_hold_user_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "user_legal_hold_created_by_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE set null
);--> statement-breakpoint
CREATE INDEX "user_legal_hold_tenant_user_idx" ON "user_legal_hold" ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_legal_hold_active_user_tenant_uq" ON "user_legal_hold" ("tenant_id","user_id") WHERE "released_at" IS NULL;
