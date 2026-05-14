CREATE TABLE "ai_job" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"action_identifier" text NOT NULL,
	"context_package_id" text NOT NULL,
	"prompt_identifier" text NOT NULL,
	"prompt_version" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer NOT NULL,
	"max_attempts" integer NOT NULL,
	"output" jsonb,
	"last_error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rag_chunk" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_title" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"visibility" text NOT NULL,
	"source_version" text NOT NULL,
	"learning_objective_ids" jsonb NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding_model_version" text NOT NULL,
	"chunking_strategy_version" text NOT NULL,
	"source_updated_at" timestamp with time zone NOT NULL,
	"indexed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_context_package_id_context_package_id_fk" FOREIGN KEY ("context_package_id") REFERENCES "public"."context_package"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rag_chunk" ADD CONSTRAINT "rag_chunk_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rag_chunk" ADD CONSTRAINT "rag_chunk_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_job_tenant_idempotency_uq" ON "ai_job" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "rag_chunk_source_chunk_uq" ON "rag_chunk" USING btree ("tenant_id","source_type","source_id","source_version","chunk_index");