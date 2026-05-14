ALTER TABLE "notification_preference" DROP CONSTRAINT "notification_preference_category_check";
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_category_check" CHECK ("notification_preference"."category" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'announcement_published', 'discussion_reply', 'system'));

CREATE TABLE "discussion_topic_subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "topic_id" text NOT NULL,
  "user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "discussion_topic_subscription" ADD CONSTRAINT "discussion_topic_subscription_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "discussion_topic_subscription" ADD CONSTRAINT "discussion_topic_subscription_topic_id_discussion_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."discussion_topic"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "discussion_topic_subscription" ADD CONSTRAINT "discussion_topic_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "discussion_topic_subscription_tenant_topic_user_uq" ON "discussion_topic_subscription" USING btree ("tenant_id","topic_id","user_id");
ALTER TABLE "discussion_topic_subscription" ADD CONSTRAINT "discussion_topic_subscription_tenant_topic_fk" FOREIGN KEY ("tenant_id","topic_id") REFERENCES "public"."discussion_topic"("tenant_id","id") ON DELETE cascade ON UPDATE no action;
