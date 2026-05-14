ALTER TABLE "grade" ADD CONSTRAINT "grade_status_check" CHECK ("grade"."status" IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete'));--> statement-breakpoint
ALTER TABLE "grade_history" DROP CONSTRAINT "grade_history_status_check";--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_status_check" CHECK ("grade_history"."status" IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete'));--> statement-breakpoint
ALTER TABLE "grade_history" DROP CONSTRAINT "grade_history_previous_status_check";--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_previous_status_check" CHECK ("grade_history"."previous_status" IS NULL OR "grade_history"."previous_status" IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete'));--> statement-breakpoint
ALTER TABLE "gradebook_manual_grade" DROP CONSTRAINT "gradebook_manual_grade_status_check";--> statement-breakpoint
ALTER TABLE "gradebook_manual_grade" ADD CONSTRAINT "gradebook_manual_grade_status_check" CHECK ("gradebook_manual_grade"."status" IN ('draft', 'published', 'locked', 'appealed', 'revised', 'incomplete'));
