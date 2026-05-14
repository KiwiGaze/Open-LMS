import {
  AssignmentPeerReview,
  type AssignmentPeerReview as AssignmentPeerReviewContract,
  CourseId,
  Draft,
  type Draft as DraftContract,
  FileResourceId,
  IntegrationConnectionId,
  Submission,
  SubmissionAttachment,
  type SubmissionAttachment as SubmissionAttachmentContract,
  SubmissionAttachmentId,
  SubmissionComment,
  type SubmissionComment as SubmissionCommentContract,
  SubmissionCommentId,
  type SubmissionCommentVisibility,
  type Submission as SubmissionContract,
  SubmissionId,
  SubmissionPlagiarismReport,
  type SubmissionPlagiarismReport as SubmissionPlagiarismReportContract,
  SubmissionPlagiarismReportId,
  type SubmissionPlagiarismReportStatus,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import {
  assignmentPeerReview,
  draft,
  submission,
  submissionAttachment,
  submissionComment,
  submissionPlagiarismReport,
} from '../db/schema/submission.ts';

export const saveDraft = async (db: Database, value: DraftContract): Promise<DraftContract> => {
  const parsed = Draft.parse(value);
  const [row] = await db
    .insert(draft)
    .values(parsed)
    .onConflictDoUpdate({
      target: [draft.tenantId, draft.id],
      set: {
        blocks: parsed.blocks,
        updatedAt: parsed.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error('Draft could not be saved because the database returned no row.');
  }

  return Draft.parse(row);
};

export const saveStudentDraft = async (
  db: Database,
  value: DraftContract,
): Promise<DraftContract> => {
  const parsed = Draft.parse(value);
  const [row] = await db
    .insert(draft)
    .values(parsed)
    .onConflictDoUpdate({
      target: [draft.tenantId, draft.id],
      set: {
        blocks: parsed.blocks,
        updatedAt: parsed.updatedAt,
      },
      setWhere: and(
        eq(draft.assignmentId, parsed.assignmentId),
        eq(draft.studentId, parsed.studentId),
      ),
    })
    .returning();

  if (!row) {
    throw new Error(
      'Draft could not be saved because it belongs to a different assignment or student.',
    );
  }

  return Draft.parse(row);
};

export const saveSubmission = async (
  db: DatabaseExecutor,
  value: SubmissionContract,
): Promise<SubmissionContract> => {
  const parsed = Submission.parse(value);
  const [row] = await db.insert(submission).values(parsed).returning();

  if (!row) {
    throw new Error('Submission could not be saved because the database returned no row.');
  }

  return Submission.parse(row);
};

export const getSubmissionById = async (
  db: Database,
  tenantId: string,
  submissionId: string,
): Promise<SubmissionContract | null> => {
  const [row] = await db
    .select()
    .from(submission)
    .where(and(eq(submission.tenantId, tenantId), eq(submission.id, submissionId)))
    .limit(1);

  if (!row || row.tenantId !== tenantId) {
    return null;
  }

  return Submission.parse(row);
};

export const listSubmissionsForStudentAssignment = async (
  db: Database,
  tenantId: string,
  assignmentId: string,
  studentId: string,
): Promise<SubmissionContract[]> => {
  const rows = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.tenantId, tenantId),
        eq(submission.assignmentId, assignmentId),
        eq(submission.studentId, studentId),
      ),
    )
    .orderBy(asc(submission.submittedAt));

  return rows.map((row) => Submission.parse(row));
};

export const listSubmissionsForAssignment = async (
  db: Database,
  tenantId: string,
  assignmentId: string,
): Promise<SubmissionContract[]> => {
  const rows = await db
    .select()
    .from(submission)
    .where(and(eq(submission.tenantId, tenantId), eq(submission.assignmentId, assignmentId)))
    .orderBy(asc(submission.submittedAt));

  return rows.map((row) => Submission.parse(row));
};

export type ListAssignmentPeerReviewsForAssignmentInput = {
  tenantId: string;
  assignmentId: string;
  reviewerId?: string;
  submissionId?: string;
};

export const listAssignmentPeerReviewsForAssignment = async (
  db: Database,
  input: ListAssignmentPeerReviewsForAssignmentInput,
): Promise<AssignmentPeerReviewContract[]> => {
  const conditions = [
    eq(assignmentPeerReview.tenantId, input.tenantId),
    eq(assignmentPeerReview.assignmentId, input.assignmentId),
  ];

  if (input.reviewerId) {
    conditions.push(eq(assignmentPeerReview.reviewerId, input.reviewerId));
  }

  if (input.submissionId) {
    conditions.push(eq(assignmentPeerReview.submissionId, input.submissionId));
  }

  const rows = await db
    .select()
    .from(assignmentPeerReview)
    .where(and(...conditions))
    .orderBy(
      sql`${assignmentPeerReview.dueAt} asc nulls last`,
      asc(assignmentPeerReview.createdAt),
      asc(assignmentPeerReview.id),
    );

  return rows.map((row) => AssignmentPeerReview.parse(row));
};

export type ListSubmissionAttachmentsForSubmissionInput = {
  tenantId: string;
  submissionId: string;
};

export type CreateSubmissionAttachmentInput = {
  tenantId: string;
  submissionId: string;
  fileResourceId: string;
  displayName: string;
  position?: number;
};

export const listSubmissionAttachmentsForSubmission = async (
  db: Database,
  input: ListSubmissionAttachmentsForSubmissionInput,
): Promise<SubmissionAttachmentContract[]> => {
  const rows = await db
    .select()
    .from(submissionAttachment)
    .where(
      and(
        eq(submissionAttachment.tenantId, input.tenantId),
        eq(submissionAttachment.submissionId, input.submissionId),
      ),
    )
    .orderBy(asc(submissionAttachment.position), asc(submissionAttachment.displayName));

  return rows.map((row) => SubmissionAttachment.parse(row));
};

const readNextSubmissionAttachmentPosition = async (
  db: Database,
  input: ListSubmissionAttachmentsForSubmissionInput,
): Promise<number> => {
  const [row] = await db
    .select({
      position: sql<number>`coalesce(max(${submissionAttachment.position}) + 1, 0)`,
    })
    .from(submissionAttachment)
    .where(
      and(
        eq(submissionAttachment.tenantId, input.tenantId),
        eq(submissionAttachment.submissionId, input.submissionId),
      ),
    );

  return Number(row?.position ?? 0);
};

export const createSubmissionAttachment = async (
  db: Database,
  input: CreateSubmissionAttachmentInput,
  now = new Date(),
): Promise<SubmissionAttachmentContract> => {
  const parsed = SubmissionAttachment.parse({
    id: SubmissionAttachmentId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    submissionId: SubmissionId.parse(input.submissionId),
    fileResourceId: FileResourceId.parse(input.fileResourceId),
    displayName: input.displayName,
    position: input.position ?? (await readNextSubmissionAttachmentPosition(db, input)),
    createdAt: now,
  });
  const [row] = await db.insert(submissionAttachment).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Submission attachment could not be created because the database returned no row.',
    );
  }

  return SubmissionAttachment.parse(row);
};

export type ListSubmissionCommentsForSubmissionInput = {
  tenantId: string;
  submissionId: string;
  visibilities: SubmissionCommentVisibility[];
};

export type CreateSubmissionCommentInput = {
  tenantId: string;
  submissionId: string;
  authorId: string;
  body: string;
  visibility: SubmissionCommentVisibility;
};

export const listSubmissionCommentsForSubmission = async (
  db: Database,
  input: ListSubmissionCommentsForSubmissionInput,
): Promise<SubmissionCommentContract[]> => {
  const rows = await db
    .select()
    .from(submissionComment)
    .where(
      and(
        eq(submissionComment.tenantId, input.tenantId),
        eq(submissionComment.submissionId, input.submissionId),
        inArray(submissionComment.visibility, input.visibilities),
      ),
    )
    .orderBy(asc(submissionComment.createdAt), asc(submissionComment.id));

  return rows.map((row) => SubmissionComment.parse(row));
};

export const createSubmissionComment = async (
  db: Database,
  input: CreateSubmissionCommentInput,
  now = new Date(),
): Promise<SubmissionCommentContract> => {
  const parsed = SubmissionComment.parse({
    id: SubmissionCommentId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    submissionId: SubmissionId.parse(input.submissionId),
    authorId: UserId.parse(input.authorId),
    body: input.body,
    visibility: input.visibility,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(submissionComment).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Submission comment could not be created because the database returned no row.',
    );
  }

  return SubmissionComment.parse(row);
};

export type RecordSubmissionPlagiarismReportInput = {
  tenantId: string;
  courseId: string;
  submissionId: string;
  integrationConnectionId: string;
  similarityPercent: number;
  reportUrl: string | null;
  status: SubmissionPlagiarismReportStatus;
  checkedAt: Date;
};

// Records a plagiarism similarity report. Upserts by (tenant, submission,
// connection) so a provider posting an updated similarity score replaces its
// prior entry.
export const recordSubmissionPlagiarismReport = async (
  db: Database,
  input: RecordSubmissionPlagiarismReportInput,
  now = new Date(),
): Promise<SubmissionPlagiarismReportContract> => {
  const newId = SubmissionPlagiarismReportId.parse(ulid());
  const [row] = await db
    .insert(submissionPlagiarismReport)
    .values({
      id: newId,
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      submissionId: SubmissionId.parse(input.submissionId),
      integrationConnectionId: IntegrationConnectionId.parse(input.integrationConnectionId),
      similarityPercent: input.similarityPercent,
      reportUrl: input.reportUrl,
      status: input.status,
      checkedAt: input.checkedAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        submissionPlagiarismReport.tenantId,
        submissionPlagiarismReport.submissionId,
        submissionPlagiarismReport.integrationConnectionId,
      ],
      set: {
        similarityPercent: input.similarityPercent,
        reportUrl: input.reportUrl,
        status: input.status,
        checkedAt: input.checkedAt,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Plagiarism report could not be recorded because the database returned no row.',
    );
  }

  return SubmissionPlagiarismReport.parse(row);
};

export type ListSubmissionPlagiarismReportsInput = {
  tenantId: string;
  submissionId: string;
};

export const listSubmissionPlagiarismReports = async (
  db: Database,
  input: ListSubmissionPlagiarismReportsInput,
): Promise<SubmissionPlagiarismReportContract[]> => {
  const rows = await db
    .select()
    .from(submissionPlagiarismReport)
    .where(
      and(
        eq(submissionPlagiarismReport.tenantId, input.tenantId),
        eq(submissionPlagiarismReport.submissionId, input.submissionId),
      ),
    )
    .orderBy(asc(submissionPlagiarismReport.checkedAt), asc(submissionPlagiarismReport.id));

  return rows.map((row) => SubmissionPlagiarismReport.parse(row));
};
