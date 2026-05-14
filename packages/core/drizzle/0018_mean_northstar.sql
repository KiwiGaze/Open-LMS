ALTER TABLE "provider_config" ADD COLUMN "validation_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_config" ADD COLUMN "validation_error" text;--> statement-breakpoint
ALTER TABLE "provider_config" ADD COLUMN "validated_at" timestamp with time zone;