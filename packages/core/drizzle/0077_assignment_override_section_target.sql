ALTER TABLE "assignment_override" DROP CONSTRAINT "assignment_override_target_type_check";--> statement-breakpoint
ALTER TABLE "assignment_override" ADD CONSTRAINT "assignment_override_target_type_check" CHECK ("assignment_override"."target_type" IN ('user', 'group', 'section'));
