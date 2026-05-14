CREATE TABLE "discussion_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text,
	"visibility" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discussion_post" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"topic_id" text NOT NULL,
	"author_id" text NOT NULL,
	"parent_post_id" text,
	"body" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_topic_tenant_id_uq" ON "discussion_topic" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_post_tenant_id_uq" ON "discussion_post" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_post_tenant_topic_id_uq" ON "discussion_post" USING btree ("tenant_id","topic_id","id");--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD CONSTRAINT "discussion_topic_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD CONSTRAINT "discussion_topic_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_topic" ADD CONSTRAINT "discussion_topic_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_topic_id_discussion_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."discussion_topic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_tenant_topic_fk" FOREIGN KEY ("tenant_id","topic_id") REFERENCES "public"."discussion_topic"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_post" ADD CONSTRAINT "discussion_post_tenant_parent_post_fk" FOREIGN KEY ("tenant_id","topic_id","parent_post_id") REFERENCES "public"."discussion_post"("tenant_id","topic_id","id") ON DELETE SET NULL ("parent_post_id") ON UPDATE no action;
