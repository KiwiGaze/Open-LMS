import { sql } from 'drizzle-orm';
import { foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const tenantMembership = pgTable(
  'tenant_membership',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantUserRoleUnique: uniqueIndex('tenant_membership_tenant_user_role_uq').on(
      table.tenantId,
      table.userId,
      table.role,
    ),
  }),
);

export type TenantMembershipRow = typeof tenantMembership.$inferSelect;
export type NewTenantMembershipRow = typeof tenantMembership.$inferInsert;

export const courseMembership = pgTable(
  'course_membership',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    status: text('status').notNull().default('active'),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    droppedAt: timestamp('dropped_at', { withTimezone: true }),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantCourseUserRoleUnique: uniqueIndex('course_membership_tenant_course_user_role_uq').on(
      table.tenantId,
      table.courseId,
      table.userId,
      table.role,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_membership_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export type CourseMembershipRow = typeof courseMembership.$inferSelect;
export type NewCourseMembershipRow = typeof courseMembership.$inferInsert;
