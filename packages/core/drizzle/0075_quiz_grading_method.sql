ALTER TABLE "quiz" ADD COLUMN "grading_method" text DEFAULT 'best' NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_grading_method_check" CHECK ("quiz"."grading_method" IN ('best', 'last', 'first', 'average'));
