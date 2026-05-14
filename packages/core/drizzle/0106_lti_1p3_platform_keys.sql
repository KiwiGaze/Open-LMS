CREATE TABLE "lti_1p3_platform_key" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "key_id" text NOT NULL,
  "status" text NOT NULL,
  "public_jwk" jsonb NOT NULL,
  "encrypted_private_jwk" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "lti_1p3_platform_key_tenant_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_platform_key_key_id_length_check"
    CHECK (length("key_id") BETWEEN 1 AND 255),
  CONSTRAINT "lti_1p3_platform_key_status_check"
    CHECK ("status" IN ('active', 'retired'))
);

CREATE UNIQUE INDEX "lti_1p3_platform_key_tenant_id_uq"
  ON "lti_1p3_platform_key" ("tenant_id", "id");

CREATE UNIQUE INDEX "lti_1p3_platform_key_tenant_key_id_uq"
  ON "lti_1p3_platform_key" ("tenant_id", "key_id");
