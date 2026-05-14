ALTER TABLE "notification_preference" DROP CONSTRAINT "notification_preference_category_check";--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_category_check" CHECK ("notification_preference"."category" IN ('feedback_published', 'ai_generation_ready', 'review_requested', 'grade_published', 'announcement_published', 'system'));
