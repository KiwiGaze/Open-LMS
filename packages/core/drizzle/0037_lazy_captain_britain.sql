CREATE TABLE "submission_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"file_resource_id" text NOT NULL,
	"display_name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_attachment_position_nonnegative_check" CHECK ("submission_attachment"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_file_resource_id_file_resource_id_fk" FOREIGN KEY ("file_resource_id") REFERENCES "public"."file_resource"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_tenant_submission_fk" FOREIGN KEY ("tenant_id","submission_id") REFERENCES "public"."submission"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_attachment" ADD CONSTRAINT "submission_attachment_tenant_file_fk" FOREIGN KEY ("tenant_id","file_resource_id") REFERENCES "public"."file_resource"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_attachment_tenant_id_uq" ON "submission_attachment" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_attachment_tenant_submission_position_uq" ON "submission_attachment" USING btree ("tenant_id","submission_id","position");