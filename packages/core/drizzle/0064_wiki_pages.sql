CREATE TABLE "wiki_page" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_page_status_check" CHECK ("wiki_page"."status" IN ('draft', 'published', 'archived')),
	CONSTRAINT "wiki_page_slug_format_check" CHECK ("wiki_page"."slug" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wiki_page_tenant_id_uq" ON "wiki_page" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "wiki_page_tenant_course_slug_uq" ON "wiki_page" USING btree ("tenant_id","course_id","slug");