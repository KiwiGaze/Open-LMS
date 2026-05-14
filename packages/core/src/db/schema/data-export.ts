import type { ExportFilters } from '@openlms/contracts';
import { foreignKey, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { fileResource } from './file.ts';
import { tenant } from './tenant.ts';

export const exportJob = pgTable(
  'export_job',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    requestedById: text('requested_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    exportType: text('export_type').notNull(),
    format: text('format').notNull(),
    status: text('status').notNull(),
    filters: jsonb('filters').$type<ExportFilters>().notNull(),
    storageFileId: text('storage_file_id').references(() => fileResource.id, {
      onDelete: 'set null',
    }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantStorageFileForeignKey: foreignKey({
      name: 'export_job_tenant_storage_file_fk',
      columns: [table.tenantId, table.storageFileId],
      foreignColumns: [fileResource.tenantId, fileResource.id],
    }).onDelete('set null'),
  }),
);
