CREATE TABLE "course_page" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"visibility" text NOT NULL,
	"version" integer NOT NULL,
	"learning_objective_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_explanation" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_page_id" text NOT NULL,
	"context_package_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_page" ADD CONSTRAINT "course_page_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_page" ADD CONSTRAINT "course_page_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_explanation" ADD CONSTRAINT "page_explanation_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_explanation" ADD CONSTRAINT "page_explanation_course_page_id_course_page_id_fk" FOREIGN KEY ("course_page_id") REFERENCES "public"."course_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_explanation" ADD CONSTRAINT "page_explanation_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "page_explanation_tenant_idempotency_uq" ON "page_explanation" USING btree ("tenant_id","idempotency_key");