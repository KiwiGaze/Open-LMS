CREATE TABLE "assignment_override" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"opens_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_override_target_type_check" CHECK ("assignment_override"."target_type" IN ('user', 'group')),
	CONSTRAINT "assignment_override_target_id_length_check" CHECK (length("assignment_override"."target_id") > 0),
	CONSTRAINT "assignment_override_status_check" CHECK ("assignment_override"."status" IN ('active', 'archived')),
	CONSTRAINT "assignment_override_availability_window_check" CHECK ("assignment_override"."opens_at" IS NULL OR "assignment_override"."closes_at" IS NULL OR "assignment_override"."closes_at" > "assignment_override"."opens_at")
);
--> statement-breakpoint
ALTER TABLE "assignment_override" ADD CONSTRAINT "assignment_override_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_override" ADD CONSTRAINT "assignment_override_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_override" ADD CONSTRAINT "assignment_override_tenant_assignment_fk" FOREIGN KEY ("tenant_id","assignment_id") REFERENCES "public"."assignment"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_override_tenant_id_uq" ON "assignment_override" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_override_tenant_assignment_target_uq" ON "assignment_override" USING btree ("tenant_id","assignment_id","target_type","target_id");