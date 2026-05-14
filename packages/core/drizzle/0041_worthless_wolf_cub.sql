CREATE TABLE "gradebook_category" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"weight_percent" real,
	"drop_lowest" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gradebook_category_name_length_check" CHECK (length("gradebook_category"."name") BETWEEN 1 AND 180),
	CONSTRAINT "gradebook_category_position_nonnegative_check" CHECK ("gradebook_category"."position" >= 0),
	CONSTRAINT "gradebook_category_weight_percent_range_check" CHECK ("gradebook_category"."weight_percent" IS NULL OR ("gradebook_category"."weight_percent" >= 0 AND "gradebook_category"."weight_percent" <= 100)),
	CONSTRAINT "gradebook_category_drop_lowest_nonnegative_check" CHECK ("gradebook_category"."drop_lowest" >= 0),
	CONSTRAINT "gradebook_category_status_check" CHECK ("gradebook_category"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
ALTER TABLE "gradebook_category" ADD CONSTRAINT "gradebook_category_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_category" ADD CONSTRAINT "gradebook_category_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gradebook_category" ADD CONSTRAINT "gradebook_category_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_category_tenant_id_uq" ON "gradebook_category" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "gradebook_category_tenant_course_position_uq" ON "gradebook_category" USING btree ("tenant_id","course_id","position");