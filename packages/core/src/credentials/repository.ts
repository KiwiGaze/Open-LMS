import {
  CourseCredential,
  type CourseCredential as CourseCredentialContract,
  CourseCredentialId,
  type CourseCredentialStatus,
  type CourseCredentialType,
  CourseId,
  CredentialAward,
  type CredentialAward as CredentialAwardContract,
  CredentialAwardId,
  type CredentialAwardStatus,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { courseCredential, credentialAward } from '../db/schema/credential.ts';

export type CreateCourseCredentialInput = {
  tenantId: string;
  courseId: string;
  credentialType: CourseCredentialType;
  title: string;
  description: string | null;
  criteriaSummary: string;
  status: CourseCredentialStatus;
  imageUrl: string | null;
};

export const createCourseCredential = async (
  db: Database,
  input: CreateCourseCredentialInput,
  now = new Date(),
): Promise<CourseCredentialContract> => {
  const parsed = CourseCredential.parse({
    id: CourseCredentialId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    credentialType: input.credentialType,
    title: input.title,
    description: input.description,
    criteriaSummary: input.criteriaSummary,
    status: input.status,
    imageUrl: input.imageUrl,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseCredential).values(parsed).returning();

  if (!row) {
    throw new Error('Course credential could not be created because the database returned no row.');
  }

  return CourseCredential.parse(row);
};

export type CreateCredentialAwardInput = {
  tenantId: string;
  credentialId: string;
  studentId: string;
  status: CredentialAwardStatus;
  issuedAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
};

export const createCredentialAward = async (
  db: Database,
  input: CreateCredentialAwardInput,
  now = new Date(),
): Promise<CredentialAwardContract> => {
  const parsed = CredentialAward.parse({
    id: CredentialAwardId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    credentialId: CourseCredentialId.parse(input.credentialId),
    studentId: UserId.parse(input.studentId),
    status: input.status,
    issuedAt: input.issuedAt,
    revokedAt: input.revokedAt,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(credentialAward).values(parsed).returning();

  if (!row) {
    throw new Error('Credential award could not be created because the database returned no row.');
  }

  return CredentialAward.parse(row);
};

export type ListCredentialsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseCredentialStatus[];
};

export const listCredentialsForCourse = async (
  db: Database,
  input: ListCredentialsForCourseInput,
): Promise<CourseCredentialContract[]> => {
  const conditions = [
    eq(courseCredential.tenantId, input.tenantId),
    eq(courseCredential.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(courseCredential.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(courseCredential)
    .where(and(...conditions))
    .orderBy(asc(courseCredential.title));

  return rows.map((row) => CourseCredential.parse(row));
};

export const getCredentialForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  credentialId: string,
): Promise<CourseCredentialContract | null> => {
  const [row] = await db
    .select()
    .from(courseCredential)
    .where(
      and(
        eq(courseCredential.tenantId, tenantId),
        eq(courseCredential.courseId, courseId),
        eq(courseCredential.id, credentialId),
      ),
    )
    .limit(1);

  return row ? CourseCredential.parse(row) : null;
};

export type UpdateCourseCredentialInput = {
  tenantId: string;
  courseId: string;
  credentialId: string;
  credentialType: CourseCredentialType;
  title: string;
  description: string | null;
  criteriaSummary: string;
  status: CourseCredentialStatus;
  imageUrl: string | null;
};

export const updateCourseCredential = async (
  db: Database,
  input: UpdateCourseCredentialInput,
  now = new Date(),
): Promise<CourseCredentialContract | null> => {
  const [row] = await db
    .update(courseCredential)
    .set({
      credentialType: input.credentialType,
      title: input.title,
      description: input.description,
      criteriaSummary: input.criteriaSummary,
      status: input.status,
      imageUrl: input.imageUrl,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseCredential.tenantId, input.tenantId),
        eq(courseCredential.courseId, input.courseId),
        eq(courseCredential.id, input.credentialId),
      ),
    )
    .returning();

  return row ? CourseCredential.parse(row) : null;
};

export type DeleteCourseCredentialInput = {
  tenantId: string;
  courseId: string;
  credentialId: string;
};

export const deleteCourseCredential = async (
  db: Database,
  input: DeleteCourseCredentialInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseCredential)
    .where(
      and(
        eq(courseCredential.tenantId, input.tenantId),
        eq(courseCredential.courseId, input.courseId),
        eq(courseCredential.id, input.credentialId),
      ),
    )
    .returning({ id: courseCredential.id });

  return result.length > 0;
};

export type ListCredentialAwardsForCredentialInput = {
  tenantId: string;
  credentialId: string;
  studentId?: string;
};

export const listCredentialAwardsForCredential = async (
  db: Database,
  input: ListCredentialAwardsForCredentialInput,
): Promise<CredentialAwardContract[]> => {
  const conditions = [
    eq(credentialAward.tenantId, input.tenantId),
    eq(credentialAward.credentialId, input.credentialId),
  ];

  if (input.studentId) {
    conditions.push(eq(credentialAward.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(credentialAward)
    .where(and(...conditions))
    .orderBy(asc(credentialAward.studentId));

  return rows.map((row) => CredentialAward.parse(row));
};
