ALTER TABLE "user" ADD COLUMN "locale" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_locale_length_check" CHECK ("user"."locale" IS NULL OR length("user"."locale") BETWEEN 2 AND 35);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_timezone_length_check" CHECK ("user"."timezone" IS NULL OR length("user"."timezone") BETWEEN 1 AND 64);
