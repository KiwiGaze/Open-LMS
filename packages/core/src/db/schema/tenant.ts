import { sql } from 'drizzle-orm';
import { bigint, check, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const tenant = pgTable(
  'tenant',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    displayName: text('display_name').notNull(),
    storageByteLimit: bigint('storage_byte_limit', { mode: 'number' }),
    defaultUserStorageByteLimit: bigint('default_user_storage_byte_limit', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    storageByteLimitPositiveCheck: check(
      'tenant_storage_byte_limit_positive_check',
      sql`${table.storageByteLimit} IS NULL OR (${table.storageByteLimit} > 0 AND ${table.storageByteLimit} <= 9007199254740991)`,
    ),
    defaultUserStorageByteLimitPositiveCheck: check(
      'tenant_default_user_storage_byte_limit_positive_check',
      sql`${table.defaultUserStorageByteLimit} IS NULL OR (${table.defaultUserStorageByteLimit} > 0 AND ${table.defaultUserStorageByteLimit} <= 9007199254740991)`,
    ),
  }),
);

export type TenantRow = typeof tenant.$inferSelect;
export type NewTenantRow = typeof tenant.$inferInsert;
