ALTER TABLE "tenant" ADD COLUMN "storage_byte_limit" bigint;
ALTER TABLE "tenant" ADD COLUMN "default_user_storage_byte_limit" bigint;

ALTER TABLE "tenant" ADD CONSTRAINT "tenant_storage_byte_limit_positive_check"
  CHECK ("storage_byte_limit" IS NULL OR ("storage_byte_limit" > 0 AND "storage_byte_limit" <= 9007199254740991));
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_default_user_storage_byte_limit_positive_check"
  CHECK ("default_user_storage_byte_limit" IS NULL OR ("default_user_storage_byte_limit" > 0 AND "default_user_storage_byte_limit" <= 9007199254740991));
