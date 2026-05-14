CREATE TABLE "tenant_feature_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_feature_flag_key_format_check" CHECK ("key" ~ '^[a-z][a-z0-9_.:-]{1,79}$'),
	CONSTRAINT "tenant_feature_flag_description_length_check" CHECK ("description" IS NULL OR (length("description") >= 1 AND length("description") <= 500))
);
--> statement-breakpoint
ALTER TABLE "tenant_feature_flag" ADD CONSTRAINT "tenant_feature_flag_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_feature_flag_tenant_key_uq" ON "tenant_feature_flag" USING btree ("tenant_id","key");
