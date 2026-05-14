CREATE TABLE "course_module" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"visibility" text NOT NULL,
	"access_policy" text NOT NULL,
	"version" integer NOT NULL,
	"position" integer NOT NULL,
	"learning_objective_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_resource" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"unit_id" text,
	"resource_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"source_uri" text,
	"visibility" text NOT NULL,
	"access_policy" text NOT NULL,
	"version" integer NOT NULL,
	"learning_objective_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"visibility" text NOT NULL,
	"access_policy" text NOT NULL,
	"version" integer NOT NULL,
	"position" integer NOT NULL,
	"learning_objective_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resource" ADD CONSTRAINT "course_resource_unit_id_course_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_unit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;