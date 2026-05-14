import { sql } from 'drizzle-orm';
import { check, foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const glossaryEntry = pgTable(
  'glossary_entry',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('glossary_entry_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseTermUnique: uniqueIndex('glossary_entry_tenant_course_term_uq').on(
      table.tenantId,
      table.courseId,
      table.term,
    ),
    statusCheck: check(
      'glossary_entry_status_check',
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'glossary_entry_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);
