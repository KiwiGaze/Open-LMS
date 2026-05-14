CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
ALTER TABLE "rag_chunk" ADD COLUMN "embedding" vector(8);--> statement-breakpoint
UPDATE "rag_chunk" SET "embedding" = '[0,0,0,0,0,0,0,0]' WHERE "embedding" IS NULL;--> statement-breakpoint
ALTER TABLE "rag_chunk" ALTER COLUMN "embedding" SET NOT NULL;
