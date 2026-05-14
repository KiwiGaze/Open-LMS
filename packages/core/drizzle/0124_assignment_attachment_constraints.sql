ALTER TABLE "assignment" ADD COLUMN "allowed_file_extensions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "max_file_size_bytes" integer;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_allowed_file_extensions_array_check" CHECK (jsonb_typeof("allowed_file_extensions") = 'array');--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_max_file_size_bytes_positive_check" CHECK ("max_file_size_bytes" IS NULL OR "max_file_size_bytes" > 0);
