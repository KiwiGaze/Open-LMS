CREATE TABLE "user_push_token" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"token" text NOT NULL,
	"locale" text,
	"app_version" text,
	"last_used_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_push_token_platform_check" CHECK ("user_push_token"."platform" IN ('ios', 'android', 'web')),
	CONSTRAINT "user_push_token_length_check" CHECK (length("user_push_token"."token") BETWEEN 1 AND 4096),
	CONSTRAINT "user_push_token_locale_length_check" CHECK ("user_push_token"."locale" IS NULL OR length("user_push_token"."locale") BETWEEN 2 AND 16),
	CONSTRAINT "user_push_token_app_version_length_check" CHECK ("user_push_token"."app_version" IS NULL OR length("user_push_token"."app_version") BETWEEN 1 AND 64)
);
--> statement-breakpoint
ALTER TABLE "user_push_token" ADD CONSTRAINT "user_push_token_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_push_token" ADD CONSTRAINT "user_push_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_push_token_tenant_id_uq" ON "user_push_token" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_push_token_unique_token_uq" ON "user_push_token" USING btree ("tenant_id","user_id","platform","token");
