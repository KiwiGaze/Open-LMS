CREATE TABLE "conversation_message" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"participant_ids" jsonb NOT NULL,
	"last_message_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_thread_id_conversation_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."conversation_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_tenant_thread_fk" FOREIGN KEY ("tenant_id","thread_id") REFERENCES "public"."conversation_thread"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_thread" ADD CONSTRAINT "conversation_thread_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_thread" ADD CONSTRAINT "conversation_thread_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_thread" ADD CONSTRAINT "conversation_thread_tenant_course_fk" FOREIGN KEY ("tenant_id","course_id") REFERENCES "public"."course"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_message_tenant_id_uq" ON "conversation_message" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_thread_tenant_id_uq" ON "conversation_thread" USING btree ("tenant_id","id");