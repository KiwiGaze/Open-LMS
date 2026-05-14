CREATE TABLE "webhook_subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenant"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "endpoint_url" text NOT NULL,
  "topics" jsonb NOT NULL,
  "status" text NOT NULL,
  "encrypted_signing_secret" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX "webhook_subscription_tenant_id_uq"
  ON "webhook_subscription" ("tenant_id", "id");
CREATE UNIQUE INDEX "webhook_subscription_tenant_name_uq"
  ON "webhook_subscription" ("tenant_id", "name");

ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_name_length_check"
  CHECK (length("name") BETWEEN 1 AND 120);
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_endpoint_url_length_check"
  CHECK (length("endpoint_url") BETWEEN 1 AND 2048);
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_endpoint_url_https_check"
  CHECK (lower("endpoint_url") LIKE 'https://%');
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_topics_array_check"
  CHECK (jsonb_typeof("topics") = 'array');
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_topics_not_empty_check"
  CHECK (jsonb_array_length("topics") BETWEEN 1 AND 50);
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_status_check"
  CHECK ("status" IN ('enabled', 'disabled'));
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_encrypted_signing_secret_length_check"
  CHECK (length("encrypted_signing_secret") BETWEEN 1 AND 4096);
