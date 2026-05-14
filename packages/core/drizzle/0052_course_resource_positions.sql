CREATE UNIQUE INDEX "course_unit_tenant_module_id_uq" ON "course_unit" USING btree ("tenant_id","module_id","id");--> statement-breakpoint
UPDATE "course_resource"
SET "module_id" = "course_unit"."module_id"
FROM "course_unit"
WHERE "course_resource"."tenant_id" = "course_unit"."tenant_id"
  AND "course_resource"."unit_id" = "course_unit"."id"
  AND "course_resource"."module_id" IS NULL;--> statement-breakpoint
ALTER TABLE "course_resource" ADD COLUMN "position" integer;--> statement-breakpoint
WITH ranked_course_resources AS (
  SELECT
    "id",
    "tenant_id",
    row_number() OVER (
      PARTITION BY "tenant_id", "course_id", "module_id", "unit_id"
      ORDER BY "title", "id"
    ) - 1 AS "position"
  FROM "course_resource"
)
UPDATE "course_resource"
SET "position" = "ranked_course_resources"."position"
FROM "ranked_course_resources"
WHERE "course_resource"."tenant_id" = "ranked_course_resources"."tenant_id"
  AND "course_resource"."id" = "ranked_course_resources"."id";--> statement-breakpoint
ALTER TABLE "course_resource" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_unit_requires_module_check" CHECK ("course_resource"."unit_id" IS NULL OR "course_resource"."module_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_module_unit_fk" FOREIGN KEY ("tenant_id","module_id","unit_id") REFERENCES "public"."course_unit"("tenant_id","module_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_position_nonnegative_check" CHECK ("course_resource"."position" >= 0);
