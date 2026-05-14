CREATE TABLE "wiki_page_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"wiki_page_id" text NOT NULL,
	"revision" integer NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_page_revision_revision_positive_check" CHECK ("wiki_page_revision"."revision" >= 1)
);
--> statement-breakpoint
ALTER TABLE "wiki_page_revision" ADD CONSTRAINT "wiki_page_revision_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_revision" ADD CONSTRAINT "wiki_page_revision_wiki_page_id_wiki_page_id_fk" FOREIGN KEY ("wiki_page_id") REFERENCES "public"."wiki_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_revision" ADD CONSTRAINT "wiki_page_revision_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_revision" ADD CONSTRAINT "wiki_page_revision_tenant_page_fk" FOREIGN KEY ("tenant_id","wiki_page_id") REFERENCES "public"."wiki_page"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wiki_page_revision_tenant_id_uq" ON "wiki_page_revision" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "wiki_page_revision_tenant_page_revision_uq" ON "wiki_page_revision" USING btree ("tenant_id","wiki_page_id","revision");