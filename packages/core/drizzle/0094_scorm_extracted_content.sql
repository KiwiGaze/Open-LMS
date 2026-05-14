CREATE TABLE "scorm_extracted_content" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"scorm_package_id" text NOT NULL,
	"source_key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"learning_objective_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scorm_extracted_content_body_length_check" CHECK (length("body") > 0)
);

ALTER TABLE "scorm_extracted_content"
ADD CONSTRAINT "scorm_extracted_content_tenant_course_fk"
FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "scorm_extracted_content"
ADD CONSTRAINT "scorm_extracted_content_tenant_package_fk"
FOREIGN KEY ("tenant_id","scorm_package_id") REFERENCES "public"."scorm_package"("tenant_id","id")
ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "scorm_extracted_content_tenant_id_uq"
ON "scorm_extracted_content" USING btree ("tenant_id","id");

CREATE UNIQUE INDEX "scorm_extracted_content_tenant_package_source_key_uq"
ON "scorm_extracted_content" USING btree ("tenant_id","scorm_package_id","source_key");
