import { sql } from 'drizzle-orm';
import { foreignKey, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.ts';
import { course } from './course.ts';
import { tenant } from './tenant.ts';

export const courseCredential = pgTable(
  'course_credential',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    credentialType: text('credential_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    criteriaSummary: text('criteria_summary').notNull(),
    status: text('status').notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('course_credential_tenant_id_uq').on(table.tenantId, table.id),
    tenantCourseForeignKey: foreignKey({
      name: 'course_credential_tenant_course_fk',
      columns: [table.tenantId, table.courseId],
      foreignColumns: [course.tenantId, course.id],
    }).onDelete('cascade'),
  }),
);

export const credentialAward = pgTable(
  'credential_award',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenant.id, { onDelete: 'cascade' }),
    credentialId: text('credential_id')
      .notNull()
      .references(() => courseCredential.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('credential_award_tenant_id_uq').on(table.tenantId, table.id),
    tenantCredentialStudentUnique: uniqueIndex('credential_award_tenant_credential_student_uq').on(
      table.tenantId,
      table.credentialId,
      table.studentId,
    ),
    tenantCredentialForeignKey: foreignKey({
      name: 'credential_award_tenant_credential_fk',
      columns: [table.tenantId, table.credentialId],
      foreignColumns: [courseCredential.tenantId, courseCredential.id],
    }).onDelete('cascade'),
  }),
);
