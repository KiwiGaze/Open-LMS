import { sql } from 'drizzle-orm';
import { foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const courseFavorite = pgTable(
  'course_favorite',
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
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantCourseUserUnique: uniqueIndex('course_favorite_tenant_course_user_uq').on(
      table.tenantId,
      table.courseId,
      table.userId,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'course_favorite_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export type CourseFavoriteRow = typeof courseFavorite.$inferSelect;
export type NewCourseFavoriteRow = typeof courseFavorite.$inferInsert;
