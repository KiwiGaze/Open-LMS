CREATE TABLE "course_external_tool" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"integration_connection_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"launch_url" text NOT NULL,
	"placement" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "course_external_tool_name_length_check" CHECK (length("course_external_tool"."name") BETWEEN 1 AND 180),
	CONSTRAINT "course_external_tool_description_length_check" CHECK ("course_external_tool"."description" IS NULL OR length("course_external_tool"."description") BETWEEN 1 AND 500),
	CONSTRAINT "course_external_tool_launch_url_length_check" CHECK (length("course_external_tool"."launch_url") BETWEEN 1 AND 2048),
	CONSTRAINT "course_external_tool_launch_url_https_check" CHECK (lower("course_external_tool"."launch_url") LIKE 'https://%'),
	CONSTRAINT "course_external_tool_placement_check" CHECK ("course_external_tool"."placement" IN ('course_navigation', 'module_item', 'assignment_selection', 'editor_button')),
	CONSTRAINT "course_external_tool_status_check" CHECK ("course_external_tool"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "integration_connection_tenant_id_uq" ON "integration_connection" USING btree ("tenant_id","id");--> statement-breakpoint
ALTER TABLE "course_external_tool" ADD CONSTRAINT "course_external_tool_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool" ADD CONSTRAINT "course_external_tool_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool" ADD CONSTRAINT "course_external_tool_integration_connection_id_integration_connection_id_fk" FOREIGN KEY ("integration_connection_id") REFERENCES "public"."integration_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool" ADD CONSTRAINT "course_external_tool_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_external_tool" ADD CONSTRAINT "course_external_tool_tenant_connection_fk" FOREIGN KEY ("tenant_id","integration_connection_id") REFERENCES "public"."integration_connection"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_external_tool_tenant_id_uq" ON "course_external_tool" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_external_tool_tenant_course_name_uq" ON "course_external_tool" USING btree ("tenant_id","course_id","name");
