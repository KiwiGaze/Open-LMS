import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const courseGroupSet = pgTable(
  'course_group_set',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    selfSignupEnabled: boolean('self_signup_enabled').notNull().default(false),
    status: text('status').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_group_set_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseIdUnique: uniqueIndex('course_group_set_tenant_course_id_uq').on(
      table.tenantId,
      table.courseId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_group_set_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    positionNonnegative: check(
      'course_group_set_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
  }),
);

export const courseGroup = pgTable(
  'course_group',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    groupSetId: text('group_set_id')
      .notNull()
      .references(() => courseGroupSet.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_group_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'course_group_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantGroupSetForeignKey: foreignKey({
      name: 'course_group_tenant_group_set_fk',
      columns: [table.tenantId, table.groupSetId],
      foreignColumns: [courseGroupSet.tenantId, courseGroupSet.id],
    }).onDelete('cascade'),
    positionNonnegative: check(
      'course_group_position_nonnegative_check',
      sql`${table.position} >= 0`,
    ),
  }),
);

export const courseGroupMember = pgTable(
  'course_group_member',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => courseGroup.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_group_member_tenant_id_uq').on(table.tenantId, table.id),
    tenantGroupUserUnique: uniqueIndex('course_group_member_tenant_group_user_uq').on(
      table.tenantId,
      table.groupId,
      table.userId,
    ),
    tenantUserIndex: index('course_group_member_tenant_user_idx').on(table.tenantId, table.userId),
    tenantGroupForeignKey: foreignKey({
      name: 'course_group_member_tenant_group_fk',
      columns: [table.tenantId, table.groupId],
      foreignColumns: [courseGroup.tenantId, courseGroup.id],
    }).onDelete('cascade'),
  }),
);
