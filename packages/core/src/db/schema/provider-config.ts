import type { ModelPreferences, ProviderCapabilities, ProviderQuota } from '@openlms/contracts';
import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenant } from './tenant.ts';

export const providerConfig = pgTable(
  'provider_config',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    providerType: text('provider_type').notNull(),
    baseUrl: text('base_url'),
    encryptedApiKey: text('encrypted_api_key').notNull(),
    modelPreferences: jsonb('model_preferences').$type<ModelPreferences>().notNull(),
    capabilities: jsonb('capabilities').$type<ProviderCapabilities>().notNull(),
    quota: jsonb('quota').$type<ProviderQuota>().notNull(),
    validationStatus: text('validation_status').notNull().default('pending'),
    validationError: text('validation_error'),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantUnique: uniqueIndex('provider_config_tenant_id_uq').on(table.tenantId),
  }),
);

export type ProviderConfigRow = typeof providerConfig.$inferSelect;
export type NewProviderConfigRow = typeof providerConfig.$inferInsert;
