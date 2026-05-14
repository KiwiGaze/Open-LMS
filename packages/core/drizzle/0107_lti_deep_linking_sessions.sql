CREATE TABLE "lti_1p3_deep_linking_session" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "course_id" text NOT NULL,
  "tool_id" text NOT NULL,
  "actor_user_id" text NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "lti_1p3_deep_linking_session_tenant_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_deep_linking_session_course_fk"
    FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_deep_linking_session_tool_fk"
    FOREIGN KEY ("tool_id") REFERENCES "course_external_tool"("id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_deep_linking_session_actor_user_fk"
    FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_deep_linking_session_tenant_course_fk"
    FOREIGN KEY ("tenant_id", "course_id") REFERENCES "course"("tenant_id", "id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_deep_linking_session_tenant_tool_fk"
    FOREIGN KEY ("tenant_id", "tool_id") REFERENCES "course_external_tool"("tenant_id", "id") ON DELETE cascade,
  CONSTRAINT "lti_1p3_deep_linking_session_status_check"
    CHECK ("status" IN ('pending', 'completed'))
);

CREATE UNIQUE INDEX "lti_1p3_deep_linking_session_tenant_id_uq"
  ON "lti_1p3_deep_linking_session" ("tenant_id", "id");

CREATE INDEX "lti_1p3_deep_linking_session_pending_idx"
  ON "lti_1p3_deep_linking_session" ("tenant_id", "status", "expires_at");
