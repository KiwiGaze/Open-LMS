CREATE TABLE "course_group" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"group_set_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_group_position_nonnegative_check" CHECK ("course_group"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "course_group_member" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_group_set" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"name" text NOT NULL,
	"self_signup_enabled" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_group_set_position_nonnegative_check" CHECK ("course_group_set"."position" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "course_group_tenant_id_uq" ON "course_group" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_group_member_tenant_id_uq" ON "course_group_member" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_group_member_tenant_group_user_uq" ON "course_group_member" USING btree ("tenant_id","group_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_group_set_tenant_id_uq" ON "course_group_set" USING btree ("tenant_id","id");--> statement-breakpoint
ALTER TABLE "course_group" ADD CONSTRAINT "course_group_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group" ADD CONSTRAINT "course_group_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group" ADD CONSTRAINT "course_group_group_set_id_course_group_set_id_fk" FOREIGN KEY ("group_set_id") REFERENCES "public"."course_group_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group" ADD CONSTRAINT "course_group_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group" ADD CONSTRAINT "course_group_tenant_group_set_fk" FOREIGN KEY ("tenant_id","group_set_id") REFERENCES "public"."course_group_set"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_member" ADD CONSTRAINT "course_group_member_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_member" ADD CONSTRAINT "course_group_member_group_id_course_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."course_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_member" ADD CONSTRAINT "course_group_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_member" ADD CONSTRAINT "course_group_member_tenant_group_fk" FOREIGN KEY ("tenant_id","group_id") REFERENCES "public"."course_group"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_set" ADD CONSTRAINT "course_group_set_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_set" ADD CONSTRAINT "course_group_set_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_group_set" ADD CONSTRAINT "course_group_set_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
