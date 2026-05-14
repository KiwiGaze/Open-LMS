ALTER TABLE "rag_chunk" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "rag_chunk" ADD COLUMN "access_policy" text;--> statement-breakpoint
UPDATE "rag_chunk"
SET
  "language" = COALESCE("language", 'en'),
  "access_policy" = COALESCE("access_policy", 'course_member');--> statement-breakpoint
ALTER TABLE "rag_chunk" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rag_chunk" ALTER COLUMN "access_policy" SET NOT NULL;
