ALTER TABLE "outbox_event" ADD COLUMN "schema_version" text;
--> statement-breakpoint
UPDATE "outbox_event" SET "schema_version" = '1' WHERE "schema_version" IS NULL;
--> statement-breakpoint
ALTER TABLE "outbox_event" ALTER COLUMN "schema_version" SET DEFAULT '1';
--> statement-breakpoint
ALTER TABLE "outbox_event" ALTER COLUMN "schema_version" SET NOT NULL;
