ALTER TABLE "learning_objective" ADD COLUMN "mastery_threshold_percent" real;--> statement-breakpoint
ALTER TABLE "learning_objective" ADD CONSTRAINT "learning_objective_mastery_threshold_percent_range_check" CHECK ("learning_objective"."mastery_threshold_percent" IS NULL OR ("learning_objective"."mastery_threshold_percent" >= 0 AND "learning_objective"."mastery_threshold_percent" <= 100));
