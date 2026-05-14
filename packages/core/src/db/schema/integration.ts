import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { assignment } from './assignment.ts';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const lti1p3PlatformKey = pgTable(
  'lti_1p3_platform_key',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    keyId: text('key_id').notNull(),
    status: text('status').notNull(),
    publicJwk: jsonb('public_jwk').$type<Record<string, unknown>>().notNull(),
    encryptedPrivateJwk: text('encrypted_private_jwk').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('lti_1p3_platform_key_tenant_id_uq').on(table.tenantId, table.id),
    tenantKeyIdUnique: uniqueIndex('lti_1p3_platform_key_tenant_key_id_uq').on(
      table.tenantId,
      table.keyId,
    ),
    keyIdLengthCheck: check(
      'lti_1p3_platform_key_key_id_length_check',
      sql`length(${table.keyId}) BETWEEN 1 AND 255`,
    ),
    statusCheck: check(
      'lti_1p3_platform_key_status_check',
      sql`${table.status} IN ('active', 'retired')`,
    ),
  }),
);

export const integrationConnection = pgTable(
  'integration_connection',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    providerType: text('provider_type').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('integration_connection_tenant_id_uq').on(table.tenantId, table.id),
  }),
);

export const webhookSubscription = pgTable(
  'webhook_subscription',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    endpointUrl: text('endpoint_url').notNull(),
    topics: jsonb('topics').$type<string[]>().notNull(),
    status: text('status').notNull(),
    encryptedSigningSecret: text('encrypted_signing_secret').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('webhook_subscription_tenant_id_uq').on(table.tenantId, table.id),
    tenantNameUnique: uniqueIndex('webhook_subscription_tenant_name_uq').on(
      table.tenantId,
      table.name,
    ),
    nameLengthCheck: check(
      'webhook_subscription_name_length_check',
      sql`length(${table.name}) BETWEEN 1 AND 120`,
    ),
    endpointUrlLengthCheck: check(
      'webhook_subscription_endpoint_url_length_check',
      sql`length(${table.endpointUrl}) BETWEEN 1 AND 2048`,
    ),
    endpointUrlHttpsCheck: check(
      'webhook_subscription_endpoint_url_https_check',
      sql`lower(${table.endpointUrl}) LIKE 'https://%'`,
    ),
    topicsArrayCheck: check(
      'webhook_subscription_topics_array_check',
      sql`jsonb_typeof(${table.topics}) = 'array'`,
    ),
    topicsNotEmptyCheck: check(
      'webhook_subscription_topics_not_empty_check',
      sql`jsonb_array_length(${table.topics}) BETWEEN 1 AND 50`,
    ),
    statusCheck: check(
      'webhook_subscription_status_check',
      sql`${table.status} IN ('enabled', 'disabled')`,
    ),
    encryptedSigningSecretLengthCheck: check(
      'webhook_subscription_encrypted_signing_secret_length_check',
      sql`length(${table.encryptedSigningSecret}) BETWEEN 1 AND 4096`,
    ),
  }),
);

export const courseExternalTool = pgTable(
  'course_external_tool',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    integrationConnectionId: text('integration_connection_id')
      .notNull()
      .references(() => integrationConnection.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    launchUrl: text('launch_url').notNull(),
    placement: text('placement').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_external_tool_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseNameUnique: uniqueIndex('course_external_tool_tenant_course_name_uq').on(
      table.tenantId,
      table.courseId,
      table.name,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_external_tool_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantConnectionForeignKey: foreignKey({
      name: 'course_external_tool_tenant_connection_fk',
      columns: [table.tenantId, table.integrationConnectionId],
      foreignColumns: [integrationConnection.tenantId, integrationConnection.id],
    }).onDelete('cascade'),
    nameLengthCheck: check(
      'course_external_tool_name_length_check',
      sql`length(${table.name}) BETWEEN 1 AND 180`,
    ),
    descriptionLengthCheck: check(
      'course_external_tool_description_length_check',
      sql`${table.description} IS NULL OR length(${table.description}) BETWEEN 1 AND 500`,
    ),
    launchUrlLengthCheck: check(
      'course_external_tool_launch_url_length_check',
      sql`length(${table.launchUrl}) BETWEEN 1 AND 2048`,
    ),
    launchUrlHttpsCheck: check(
      'course_external_tool_launch_url_https_check',
      sql`lower(${table.launchUrl}) LIKE 'https://%'`,
    ),
    placementCheck: check(
      'course_external_tool_placement_check',
      sql`${table.placement} IN ('course_navigation', 'module_item', 'assignment_selection', 'editor_button')`,
    ),
    statusCheck: check(
      'course_external_tool_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
  }),
);

export const courseExternalToolOutcome = pgTable(
  'course_external_tool_outcome',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => assignment.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    externalToolId: text('external_tool_id')
      .notNull()
      .references(() => courseExternalTool.id, { onDelete: 'cascade' }),
    score: real('score').notNull(),
    maxScore: real('max_score').notNull(),
    status: text('status').notNull(),
    reportedAt: timestamp('reported_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_external_tool_outcome_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    uniquePerTuple: uniqueIndex('course_external_tool_outcome_unique_per_tuple_uq').on(
      table.tenantId,
      table.assignmentId,
      table.studentId,
      table.externalToolId,
    ),
    tenantAssignmentForeignKey: foreignKey({
      name: 'course_external_tool_outcome_tenant_assignment_fk',
      columns: [table.tenantId, table.assignmentId],
      foreignColumns: [assignment.tenantId, assignment.id],
    }).onDelete('cascade'),
    tenantExternalToolForeignKey: foreignKey({
      name: 'course_external_tool_outcome_tenant_external_tool_fk',
      columns: [table.tenantId, table.externalToolId],
      foreignColumns: [courseExternalTool.tenantId, courseExternalTool.id],
    }).onDelete('cascade'),
    statusCheck: check(
      'course_external_tool_outcome_status_check',
      sql`${table.status} IN ('pending', 'published', 'rejected')`,
    ),
    scoreRangeCheck: check(
      'course_external_tool_outcome_score_range_check',
      sql`${table.score} >= 0 AND ${table.score} <= ${table.maxScore}`,
    ),
    maxScorePositiveCheck: check(
      'course_external_tool_outcome_max_score_positive_check',
      sql`${table.maxScore} > 0`,
    ),
  }),
);

export const lti1p3DeepLinkingSession = pgTable(
  'lti_1p3_deep_linking_session',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    toolId: text('tool_id')
      .notNull()
      .references(() => courseExternalTool.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('lti_1p3_deep_linking_session_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    pendingIndex: index('lti_1p3_deep_linking_session_pending_idx').on(
      table.tenantId,
      table.status,
      table.expiresAt,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'lti_1p3_deep_linking_session_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantToolForeignKey: foreignKey({
      name: 'lti_1p3_deep_linking_session_tenant_tool_fk',
      columns: [table.tenantId, table.toolId],
      foreignColumns: [courseExternalTool.tenantId, courseExternalTool.id],
    }).onDelete('cascade'),
    statusCheck: check(
      'lti_1p3_deep_linking_session_status_check',
      sql`${table.status} IN ('pending', 'completed')`,
    ),
  }),
);
