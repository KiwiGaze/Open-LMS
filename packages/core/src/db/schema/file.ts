import { foreignKey, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const fileResource = pgTable(
  'file_resource',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    storageProvider: text('storage_provider').notNull(),
    storageKey: text('storage_key').notNull(),
    filename: text('filename').notNull(),
    mediaType: text('media_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    checksumSha256: text('checksum_sha256').notNull(),
    visibility: text('visibility').notNull(),
    altText: text('alt_text'),
    transcriptText: text('transcript_text'),
    license: text('license'),
    copyrightHolder: text('copyright_holder'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('file_resource_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'file_resource_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('set null'),
  }),
);
