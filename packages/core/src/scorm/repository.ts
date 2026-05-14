import {
  CourseId,
  LearningObjectiveId,
  ScormAttempt,
  type ScormAttempt as ScormAttemptContract,
  ScormAttemptId,
  type ScormCompletionStatus,
  ScormExtractedContent,
  type ScormExtractedContent as ScormExtractedContentContract,
  ScormExtractedContentId,
  ScormPackage,
  type ScormPackage as ScormPackageContract,
  ScormPackageId,
  type ScormPackageStatus,
  type ScormSuccessStatus,
  type ScormVersion,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { scormAttempt, scormExtractedContent, scormPackage } from '../db/schema/scorm.ts';

export type CreateScormPackageInput = {
  tenantId: string;
  courseId: string;
  title: string;
  scormVersion: ScormVersion;
  launchUrl: string;
  manifest: Record<string, unknown>;
  status: ScormPackageStatus;
};

export const createScormPackage = async (
  db: Database,
  input: CreateScormPackageInput,
  now = new Date(),
): Promise<ScormPackageContract> => {
  const parsed = ScormPackage.parse({
    id: ScormPackageId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    scormVersion: input.scormVersion,
    launchUrl: input.launchUrl,
    manifest: input.manifest,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(scormPackage).values(parsed).returning();
  if (!row) {
    throw new Error('SCORM package could not be created because the database returned no row.');
  }
  return ScormPackage.parse(row);
};

export type ListScormPackagesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses?: ScormPackageStatus[];
};

export const listScormPackagesForCourse = async (
  db: Database,
  input: ListScormPackagesForCourseInput,
): Promise<ScormPackageContract[]> => {
  const conditions = [
    eq(scormPackage.tenantId, input.tenantId),
    eq(scormPackage.courseId, input.courseId),
  ];
  if (input.statuses && input.statuses.length > 0) {
    conditions.push(inArray(scormPackage.status, input.statuses));
  }
  const rows = await db
    .select()
    .from(scormPackage)
    .where(and(...conditions))
    .orderBy(asc(scormPackage.title), asc(scormPackage.id));
  return rows.map((row) => ScormPackage.parse(row));
};

export const getScormPackageForCourse = async (
  db: Database,
  input: {
    tenantId: string;
    courseId: string;
    scormPackageId: string;
  },
): Promise<ScormPackageContract | null> => {
  const [row] = await db
    .select()
    .from(scormPackage)
    .where(
      and(
        eq(scormPackage.tenantId, input.tenantId),
        eq(scormPackage.courseId, input.courseId),
        eq(scormPackage.id, input.scormPackageId),
      ),
    )
    .limit(1);

  return row ? ScormPackage.parse(row) : null;
};

export type UpsertScormExtractedContentInput = {
  tenantId: string;
  courseId: string;
  scormPackageId: string;
  sourceKey: string;
  title: string;
  body: string;
  language?: string;
  learningObjectiveIds: string[];
  sourceVersion: string;
};

export const upsertScormExtractedContent = async (
  db: Database,
  input: UpsertScormExtractedContentInput,
  now = new Date(),
): Promise<ScormExtractedContentContract> => {
  const parsed = ScormExtractedContent.parse({
    id: ScormExtractedContentId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    scormPackageId: ScormPackageId.parse(input.scormPackageId),
    sourceKey: input.sourceKey,
    title: input.title,
    body: input.body,
    language: input.language ?? 'en',
    learningObjectiveIds: input.learningObjectiveIds.map((id) => LearningObjectiveId.parse(id)),
    sourceVersion: input.sourceVersion,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .insert(scormExtractedContent)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        scormExtractedContent.tenantId,
        scormExtractedContent.scormPackageId,
        scormExtractedContent.sourceKey,
      ],
      set: {
        title: parsed.title,
        body: parsed.body,
        language: parsed.language,
        learningObjectiveIds: parsed.learningObjectiveIds,
        sourceVersion: parsed.sourceVersion,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'SCORM extracted content could not be upserted because the database returned no row.',
    );
  }

  return ScormExtractedContent.parse(row);
};

export type ListScormExtractedContentForPackageInput = {
  tenantId: string;
  scormPackageId: string;
};

export const listScormExtractedContentForPackage = async (
  db: Database,
  input: ListScormExtractedContentForPackageInput,
): Promise<ScormExtractedContentContract[]> => {
  const rows = await db
    .select()
    .from(scormExtractedContent)
    .where(
      and(
        eq(scormExtractedContent.tenantId, input.tenantId),
        eq(scormExtractedContent.scormPackageId, input.scormPackageId),
      ),
    )
    .orderBy(asc(scormExtractedContent.title), asc(scormExtractedContent.id));

  return rows.map((row) => ScormExtractedContent.parse(row));
};

export type UpsertScormAttemptInput = {
  tenantId: string;
  scormPackageId: string;
  studentId: string;
  completionStatus: ScormCompletionStatus;
  successStatus: ScormSuccessStatus;
  scoreScaled: number | null;
  totalTimeSeconds: number | null;
  suspendData: string | null;
  lastVisitedAt: Date | null;
};

export const upsertScormAttempt = async (
  db: Database,
  input: UpsertScormAttemptInput,
  now = new Date(),
): Promise<ScormAttemptContract> => {
  const candidate = ScormAttempt.parse({
    id: ScormAttemptId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    scormPackageId: ScormPackageId.parse(input.scormPackageId),
    studentId: UserId.parse(input.studentId),
    completionStatus: input.completionStatus,
    successStatus: input.successStatus,
    scoreScaled: input.scoreScaled,
    totalTimeSeconds: input.totalTimeSeconds,
    suspendData: input.suspendData,
    lastVisitedAt: input.lastVisitedAt,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .insert(scormAttempt)
    .values(candidate)
    .onConflictDoUpdate({
      target: [scormAttempt.tenantId, scormAttempt.scormPackageId, scormAttempt.studentId],
      set: {
        completionStatus: input.completionStatus,
        successStatus: input.successStatus,
        scoreScaled: input.scoreScaled,
        totalTimeSeconds: input.totalTimeSeconds,
        suspendData: input.suspendData,
        lastVisitedAt: input.lastVisitedAt,
        updatedAt: now,
      },
    })
    .returning();
  if (!row) {
    throw new Error('SCORM attempt could not be upserted because the database returned no row.');
  }
  return ScormAttempt.parse(row);
};

export const getScormAttemptForStudent = async (
  db: Database,
  input: {
    tenantId: string;
    scormPackageId: string;
    studentId: string;
  },
): Promise<ScormAttemptContract | null> => {
  const [row] = await db
    .select()
    .from(scormAttempt)
    .where(
      and(
        eq(scormAttempt.tenantId, input.tenantId),
        eq(scormAttempt.scormPackageId, input.scormPackageId),
        eq(scormAttempt.studentId, input.studentId),
      ),
    )
    .limit(1);

  return row ? ScormAttempt.parse(row) : null;
};
