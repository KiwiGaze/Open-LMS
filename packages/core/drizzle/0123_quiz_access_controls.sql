ALTER TABLE "quiz" ADD COLUMN "access_password_hash" text;--> statement-breakpoint
ALTER TABLE "quiz" ADD COLUMN "allowed_ip_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_access_password_hash_length_check" CHECK ("access_password_hash" IS NULL OR char_length("access_password_hash") BETWEEN 1 AND 512);--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_allowed_ip_ranges_array_check" CHECK (jsonb_typeof("allowed_ip_ranges") = 'array');
