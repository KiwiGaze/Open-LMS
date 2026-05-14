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
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const wikiPage = pgTable(
  'wiki_page',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    status: text('status').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull().default([]),
    createdById: text('created_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('wiki_page_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseSlugUnique: uniqueIndex('wiki_page_tenant_course_slug_uq').on(
      table.tenantId,
      table.courseId,
      table.slug,
    ),
    statusCheck: check(
      'wiki_page_status_check',
      sql`${table.status} IN ('draft', 'published', 'archived')`,
    ),
    slugFormatCheck: check(
      'wiki_page_slug_format_check',
      sql`${table.slug} ~ '^[a-z0-9][a-z0-9-]*$'`,
    ),
    tenantCourseForeignKey: foreignKey({
      name: 'wiki_page_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const wikiPageRevision = pgTable(
  'wiki_page_revision',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    wikiPageId: text('wiki_page_id')
      .notNull()
      .references(() => wikiPage.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    learningObjectiveIds: jsonb('learning_objective_ids').$type<string[]>().notNull().default([]),
    summary: text('summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('wiki_page_revision_tenant_id_uq').on(table.tenantId, table.id),
    tenantPageRevisionUnique: uniqueIndex('wiki_page_revision_tenant_page_revision_uq').on(
      table.tenantId,
      table.wikiPageId,
      table.revision,
    ),
    revisionPositiveCheck: check(
      'wiki_page_revision_revision_positive_check',
      sql`${table.revision} >= 1`,
    ),
    tenantPageForeignKey: foreignKey({
      name: 'wiki_page_revision_tenant_page_fk',
      columns: [table.tenantId, table.wikiPageId],
      foreignColumns: [wikiPage.tenantId, wikiPage.id],
    }).onDelete('cascade'),
  }),
);
