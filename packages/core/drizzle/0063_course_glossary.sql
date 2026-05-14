CREATE TABLE "glossary_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_entry_status_check" CHECK ("glossary_entry"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
ALTER TABLE "glossary_entry" ADD CONSTRAINT "glossary_entry_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_entry" ADD CONSTRAINT "glossary_entry_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_entry" ADD CONSTRAINT "glossary_entry_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_entry_tenant_id_uq" ON "glossary_entry" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_entry_tenant_course_term_uq" ON "glossary_entry" USING btree ("tenant_id","course_id","term");