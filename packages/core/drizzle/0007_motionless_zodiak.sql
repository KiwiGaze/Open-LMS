CREATE TABLE "export_job" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"requested_by_id" text NOT NULL,
	"export_type" text NOT NULL,
	"format" text NOT NULL,
	"status" text NOT NULL,
	"filters" jsonb NOT NULL,
	"storage_file_id" text,
	"error_message" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"provider_type" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_storage_file_id_file_resource_id_fk" FOREIGN KEY ("storage_file_id") REFERENCES "public"."file_resource"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connection" ADD CONSTRAINT "integration_connection_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;