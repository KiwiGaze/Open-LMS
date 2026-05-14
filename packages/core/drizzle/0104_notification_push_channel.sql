ALTER TABLE "notification_preference" DROP CONSTRAINT "notification_preference_channel_check";--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_channel_check" CHECK ("notification_preference"."channel" IN ('in_app', 'email', 'push'));
