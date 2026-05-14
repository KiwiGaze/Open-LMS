CREATE TABLE "notification_preference" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"channel" text NOT NULL,
	"frequency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preference_category_check" CHECK ("notification_preference"."category" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'system')),
	CONSTRAINT "notification_preference_channel_check" CHECK ("notification_preference"."channel" IN ('in_app', 'email')),
	CONSTRAINT "notification_preference_frequency_check" CHECK ("notification_preference"."frequency" IN ('immediate', 'daily_digest', 'weekly_digest', 'off'))
);
--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preference_tenant_user_category_channel_uq" ON "notification_preference" USING btree ("tenant_id","user_id","category","channel");