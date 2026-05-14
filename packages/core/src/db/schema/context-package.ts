import type { ContextPackage, ContextResource } from '@openlms/contracts';
import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const contextPackage = pgTable(
  'context_package',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    actionIdentifier: text('action_identifier').notNull(),
    actorId: text('actor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    resources: jsonb('resources').$type<ContextResource[]>().notNull(),
    policyStamp: jsonb('policy_stamp').$type<ContextPackage['policyStamp']>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('context_package_tenant_id_uq').on(table.tenantId, table.id),
  }),
);
