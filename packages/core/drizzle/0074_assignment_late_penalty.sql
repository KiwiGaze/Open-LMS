ALTER TABLE "assignment" ADD COLUMN "late_penalty_percent_per_day" real;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "late_max_penalty_percent" real;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_late_penalty_percent_per_day_range_check" CHECK ("assignment"."late_penalty_percent_per_day" IS NULL OR ("assignment"."late_penalty_percent_per_day" >= 0 AND "assignment"."late_penalty_percent_per_day" <= 100));--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_late_max_penalty_percent_range_check" CHECK ("assignment"."late_max_penalty_percent" IS NULL OR ("assignment"."late_max_penalty_percent" >= 0 AND "assignment"."late_max_penalty_percent" <= 100));
