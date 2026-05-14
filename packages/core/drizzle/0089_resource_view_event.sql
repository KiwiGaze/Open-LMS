CREATE TABLE "course_resource_view_event" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"viewer_id" text NOT NULL,
	"viewed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_resource_view_event" ADD CONSTRAINT "course_resource_view_event_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource_view_event" ADD CONSTRAINT "course_resource_view_event_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource_view_event" ADD CONSTRAINT "course_resource_view_event_resource_id_course_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."course_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource_view_event" ADD CONSTRAINT "course_resource_view_event_viewer_id_user_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource_view_event" ADD CONSTRAINT "course_resource_view_event_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource_view_event" ADD CONSTRAINT "course_resource_view_event_tenant_resource_fk" FOREIGN KEY ("tenant_id","resource_id") REFERENCES "public"."course_resource"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_resource_view_event_tenant_id_uq" ON "course_resource_view_event" USING btree ("tenant_id","id");
