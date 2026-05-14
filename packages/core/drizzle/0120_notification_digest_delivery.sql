CREATE UNIQUE INDEX "notification_tenant_id_uq" ON "notification" ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_tenant_recipient_id_uq" ON "notification" ("tenant_id","recipient_id","id");--> statement-breakpoint
CREATE TABLE "notification_digest_delivery" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "recipient_id" text NOT NULL,
  "notification_id" text NOT NULL,
  "channel" text NOT NULL,
  "frequency" text NOT NULL,
  "delivered_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notification_digest_delivery_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
  CONSTRAINT "notification_digest_delivery_recipient_fk" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "notification_digest_delivery_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade,
  CONSTRAINT "notification_digest_delivery_notification_fk" FOREIGN KEY ("tenant_id","notification_id") REFERENCES "notification"("tenant_id","id") ON DELETE cascade,
  CONSTRAINT "notification_digest_delivery_recipient_notification_fk" FOREIGN KEY ("tenant_id","recipient_id","notification_id") REFERENCES "notification"("tenant_id","recipient_id","id") ON DELETE cascade,
  CONSTRAINT "notification_digest_delivery_channel_check" CHECK ("channel" IN ('email')),
  CONSTRAINT "notification_digest_delivery_frequency_check" CHECK ("frequency" IN ('daily_digest', 'weekly_digest'))
);--> statement-breakpoint
CREATE UNIQUE INDEX "notification_digest_delivery_once_uq" ON "notification_digest_delivery" ("tenant_id","notification_id","channel","frequency");
