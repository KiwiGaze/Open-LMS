ALTER TABLE "submission_comment" DROP CONSTRAINT "submission_comment_visibility_check";--> statement-breakpoint
ALTER TABLE "submission_comment" ADD CONSTRAINT "submission_comment_visibility_check" CHECK ("submission_comment"."visibility" IN ('student_visible', 'staff_only', 'peer_reviewer_visible'));
