import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseModule } from './course.ts';
import { tenant } from './tenant.ts';

export const courseModuleReleaseRule = pgTable(
  'course_module_release_rule',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull().default('module'),
    targetId: text('target_id'),
    ruleType: text('rule_type').notNull(),
    config: jsonb('config').notNull(),
    position: integer('position').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_release_rule_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantModuleIdUnique: uniqueIndex('course_module_release_rule_tenant_module_id_uq').on(
      table.tenantId,
      table.moduleId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_release_rule_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_module_release_rule_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    ruleTypeCheck: check(
      'course_module_release_rule_rule_type_check',
      sql`${table.ruleType} IN ('prerequisite_modules', 'objective_mastery', 'date_after', 'manual_unlock')`,
    ),
    targetTypeCheck: check(
      'course_module_release_rule_target_type_check',
      sql`${table.targetType} IN ('module', 'course_page', 'course_resource', 'assignment')`,
    ),
    targetIdCheck: check(
      'course_module_release_rule_target_id_check',
      sql`(${table.targetType} = 'module' AND ${table.targetId} IS NULL) OR (${table.targetType} <> 'module' AND ${table.targetId} IS NOT NULL)`,
    ),
    manualUnlockTargetCheck: check(
      'course_module_release_rule_manual_unlock_target_check',
      sql`NOT (${table.ruleType} = 'manual_unlock' AND ${table.targetType} <> 'module')`,
    ),
    statusCheck: check(
      'course_module_release_rule_status_check',
      sql`${table.status} IN ('active', 'archived')`,
    ),
    positionNonnegativeCheck: check(
      'course_module_release_rule_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
  }),
);

export const courseModuleReleasePolicy = pgTable(
  'course_module_release_policy',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    combinator: text('combinator').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_release_policy_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantModuleUnique: uniqueIndex('course_module_release_policy_tenant_module_uq').on(
      table.tenantId,
      table.moduleId,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_release_policy_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_module_release_policy_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    combinatorCheck: check(
      'course_module_release_policy_combinator_check',
      sql`${table.combinator} IN ('all', 'any')`,
    ),
  }),
);

export const courseModuleReleaseOverride = pgTable(
  'course_module_release_override',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => courseModule.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    state: text('state').notNull(),
    reason: text('reason'),
    grantedByUserId: text('granted_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().default(sql`now()`),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_module_release_override_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantModuleStudentUnique: uniqueIndex(
      'course_module_release_override_tenant_module_student_uq',
    ).on(table.tenantId, table.moduleId, table.studentId),
    tenantCourseForeignKey: foreignKey({
      name: 'course_module_release_override_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantModuleForeignKey: foreignKey({
      name: 'course_module_release_override_tenant_module_fk',
      columns: [table.tenantId, table.moduleId],
      foreignColumns: [courseModule.tenantId, courseModule.id],
    }).onDelete('cascade'),
    stateCheck: check(
      'course_module_release_override_state_check',
      sql`${table.state} IN ('unlocked', 'locked')`,
    ),
  }),
);
