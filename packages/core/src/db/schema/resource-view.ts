import { sql } from 'drizzle-orm';
import { foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course, courseResource } from './course.ts';
import { tenant } from './tenant.ts';

export const courseResourceViewEvent = pgTable(
  'course_resource_view_event',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id')
      .notNull()
      .references(() => courseResource.id, { onDelete: 'cascade' }),
    viewerId: text('viewer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_resource_view_event_tenant_id_uq').on(
      table.tenantId,
      table.id,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_resource_view_event_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
    tenantResourceForeignKey: foreignKey({
      name: 'course_resource_view_event_tenant_resource_fk',
      columns: [table.tenantId, table.resourceId],
      foreignColumns: [courseResource.tenantId, courseResource.id],
    }).onDelete('cascade'),
  }),
);
