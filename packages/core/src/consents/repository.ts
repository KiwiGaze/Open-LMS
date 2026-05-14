import {
  Consent,
  type Consent as ConsentContract,
  ConsentId,
  InstitutionConsentPolicy,
  type InstitutionConsentPolicy as InstitutionConsentPolicyContract,
} from '@openlms/contracts';
import { and, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import {
  type ConsentRow,
  type InstitutionConsentPolicyRow,
  consent,
  institutionConsentPolicy,
} from '../db/schema/consent.ts';

const toIntegerFlag = (value: boolean): number => (value ? 1 : 0);
const fromIntegerFlag = (value: number): boolean => value === 1;

const toInstitutionConsentPolicy = (
  row: InstitutionConsentPolicyRow,
): InstitutionConsentPolicyContract =>
  InstitutionConsentPolicy.parse({
    tenantId: row.tenantId,
    defaultPosture: row.defaultPosture,
    jurisdictionProfile: row.jurisdictionProfile,
    ageGateEnabled: fromIntegerFlag(row.ageGateEnabled),
    reconsentTriggers: row.reconsentTriggers,
    minNForDisclosure: row.minNForDisclosure,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

const toConsent = (row: ConsentRow): ConsentContract => Consent.parse(row);

export const saveInstitutionConsentPolicy = async (
  db: Database,
  value: InstitutionConsentPolicyContract,
): Promise<InstitutionConsentPolicyContract> => {
  const parsed = InstitutionConsentPolicy.parse(value);
  const [row] = await db
    .insert(institutionConsentPolicy)
    .values({
      tenantId: parsed.tenantId,
      defaultPosture: parsed.defaultPosture,
      jurisdictionProfile: parsed.jurisdictionProfile,
      ageGateEnabled: toIntegerFlag(parsed.ageGateEnabled),
      reconsentTriggers: parsed.reconsentTriggers,
      minNForDisclosure: parsed.minNForDisclosure,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    })
    .onConflictDoUpdate({
      target: institutionConsentPolicy.tenantId,
      set: {
        defaultPosture: parsed.defaultPosture,
        jurisdictionProfile: parsed.jurisdictionProfile,
        ageGateEnabled: toIntegerFlag(parsed.ageGateEnabled),
        reconsentTriggers: parsed.reconsentTriggers,
        minNForDisclosure: parsed.minNForDisclosure,
        updatedAt: parsed.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Institution consent policy could not be saved because the database returned no row.',
    );
  }

  return toInstitutionConsentPolicy(row);
};

export const getInstitutionConsentPolicyByTenantId = async (
  db: Database,
  tenantId: string,
): Promise<InstitutionConsentPolicyContract | null> => {
  const [row] = await db
    .select()
    .from(institutionConsentPolicy)
    .where(eq(institutionConsentPolicy.tenantId, tenantId))
    .limit(1);

  return row ? toInstitutionConsentPolicy(row) : null;
};

export const saveConsent = async (
  db: Database,
  value: ConsentContract,
): Promise<ConsentContract> => {
  const parsed = Consent.parse(value);
  const [row] = await db.insert(consent).values(parsed).returning();

  if (!row) {
    throw new Error('Consent could not be saved because the database returned no row.');
  }

  return toConsent(row);
};

export type AppendConsentInput = {
  tenantId: string;
  subjectId: string;
  actionType: ConsentContract['actionType'];
  scope: ConsentContract['scope'];
  scopeId: string;
  state: 'granted' | 'revoked';
  evidence: string | null;
  expiresAt: Date | null;
};

// Appends a new consent record (with a fresh ULID) for the subject. The
// `consent` table is append-only history; the AI policy evaluator picks the
// most recent matching row at decision time.
export const appendConsent = async (
  db: Database,
  input: AppendConsentInput,
): Promise<ConsentContract> => {
  const now = new Date();
  const base = {
    id: ConsentId.parse(ulid()),
    tenantId: input.tenantId,
    subjectId: input.subjectId,
    actionType: input.actionType,
    scope: input.scope,
    scopeId: input.scopeId,
    evidence: input.evidence,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  };
  const record: ConsentContract = Consent.parse(
    input.state === 'granted'
      ? {
          ...base,
          state: 'granted',
          grantedBy: 'subject',
          grantedAt: now,
          revokedAt: null,
        }
      : {
          ...base,
          state: 'revoked',
          grantedBy: null,
          grantedAt: null,
          revokedAt: now,
        },
  );

  return saveConsent(db, record);
};

export const listConsentsForSubject = async (
  db: Database,
  tenantId: string,
  subjectId: string,
): Promise<ConsentContract[]> => {
  const rows = await db
    .select()
    .from(consent)
    .where(and(eq(consent.tenantId, tenantId), eq(consent.subjectId, subjectId)))
    .orderBy(consent.createdAt);

  return rows.map(toConsent);
};

export const listConsentsForSubjects = async (
  db: Database,
  tenantId: string,
  subjectIds: string[],
): Promise<ConsentContract[]> => {
  if (subjectIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(consent)
    .where(and(eq(consent.tenantId, tenantId), inArray(consent.subjectId, subjectIds)))
    .orderBy(consent.createdAt);

  return rows.map(toConsent);
};
