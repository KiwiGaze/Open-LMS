CREATE TABLE "course_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"credential_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"criteria_summary" text NOT NULL,
	"status" text NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential_award" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_credential" ADD CONSTRAINT "course_credential_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_credential" ADD CONSTRAINT "course_credential_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_credential" ADD CONSTRAINT "course_credential_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_award" ADD CONSTRAINT "credential_award_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_award" ADD CONSTRAINT "credential_award_credential_id_course_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."course_credential"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_award" ADD CONSTRAINT "credential_award_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_award" ADD CONSTRAINT "credential_award_tenant_credential_fk" FOREIGN KEY ("tenant_id","credential_id") REFERENCES "public"."course_credential"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_credential_tenant_id_uq" ON "course_credential" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "credential_award_tenant_id_uq" ON "credential_award" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "credential_award_tenant_credential_student_uq" ON "credential_award" USING btree ("tenant_id","credential_id","student_id");