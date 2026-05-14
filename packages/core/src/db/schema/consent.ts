import { sql } from 'drizzle-orm';
import { check, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { tenant } from './tenant.ts';

export const consent = pgTable(
  'consent',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    subjectId: text('subject_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    actionType: text('action_type').notNull(),
    scope: text('scope').notNull(),
    scopeId: text('scope_id').notNull(),
    state: text('state').notNull(),
    grantedBy: text('granted_by'),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    evidence: text('evidence'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    lifecycleStateCheck: check(
      'consent_lifecycle_state_check',
      sql`(
        (${table.state} = 'granted' AND ${table.grantedBy} IS NOT NULL AND ${table.grantedAt} IS NOT NULL AND ${table.revokedAt} IS NULL)
        OR (${table.state} = 'revoked' AND ${table.revokedAt} IS NOT NULL)
        OR (${table.state} = 'pending' AND ${table.grantedBy} IS NULL AND ${table.grantedAt} IS NULL AND ${table.revokedAt} IS NULL)
        OR (${table.state} = 'expired' AND ${table.expiresAt} IS NOT NULL AND ${table.revokedAt} IS NULL)
      )`,
    ),
  }),
);

export const institutionConsentPolicy = pgTable('institution_consent_policy', {
  tenantId: text('tenant_id')
    .primaryKey()
    .references(() => tenant.id, { onDelete: 'cascade' }),
  defaultPosture: text('default_posture').notNull(),
  jurisdictionProfile: text('jurisdiction_profile').notNull(),
  ageGateEnabled: integer('age_gate_enabled').notNull().default(0),
  reconsentTriggers: jsonb('reconsent_triggers').$type<string[]>().notNull(),
  minNForDisclosure: integer('min_n_for_disclosure').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export type ConsentRow = typeof consent.$inferSelect;
export type InstitutionConsentPolicyRow = typeof institutionConsentPolicy.$inferSelect;
