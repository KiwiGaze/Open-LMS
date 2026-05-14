CREATE TABLE "xapi_statement" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"statement_id" text NOT NULL,
	"received_by_id" text NOT NULL,
	"actor" jsonb NOT NULL,
	"verb" jsonb NOT NULL,
	"object" jsonb NOT NULL,
	"result" jsonb,
	"context" jsonb,
	"timestamp" timestamp with time zone,
	"stored_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "xapi_statement" ADD CONSTRAINT "xapi_statement_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "xapi_statement" ADD CONSTRAINT "xapi_statement_received_by_id_user_id_fk" FOREIGN KEY ("received_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "xapi_statement_tenant_id_uq" ON "xapi_statement" USING btree ("tenant_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX "xapi_statement_tenant_statement_uq" ON "xapi_statement" USING btree ("tenant_id","statement_id");
