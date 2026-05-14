import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const courseAnnouncement = pgTable(
  'course_announcement',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    status: text('status').notNull(),
    pinned: boolean('pinned').notNull().default(false),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_announcement_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseStatusIndex: index('course_announcement_tenant_course_status_idx').on(
      table.tenantId,
      table.courseId,
      table.status,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_announcement_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);
