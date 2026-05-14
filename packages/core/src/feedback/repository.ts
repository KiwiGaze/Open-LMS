import {
  AiFeedbackDraft,
  type AiFeedbackDraft as AiFeedbackDraftContract,
  CourseGradingScheme,
  type CourseGradingScheme as CourseGradingSchemeContract,
  type CourseGradingSchemeEntry,
  CourseGradingSchemeId,
  type CourseGradingSchemeStatus,
  CourseId,
  FeedbackDialogue,
  type FeedbackDialogue as FeedbackDialogueContract,
  FeedbackDialogueMessage,
  type FeedbackDialogueMessage as FeedbackDialogueMessageContract,
  Grade,
  GradeAppeal,
  type GradeAppeal as GradeAppealContract,
  GradeAppealId,
  type GradeAppealStatus,
  type Grade as GradeContract,
  GradeHistory,
  type GradeHistory as GradeHistoryContract,
  GradeHistoryId,
  GradeId,
  type GradeSource,
  type GradeStatus,
  GradebookCategory,
  type GradebookCategory as GradebookCategoryContract,
  GradebookCategoryId,
  type GradebookCategoryStatus,
  GradebookEntry,
  type GradebookEntry as GradebookEntryContract,
  GradebookManualGrade,
  type GradebookManualGrade as GradebookManualGradeContract,
  GradebookManualGradeId,
  GradebookManualItem,
  type GradebookManualItem as GradebookManualItemContract,
  GradebookManualItemId,
  type GradebookManualItemStatus,
  HumanReview,
  type HumanReview as HumanReviewContract,
  type HumanReviewDecision,
  PublishedFeedback,
  type PublishedFeedback as PublishedFeedbackContract,
  SubmissionId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { assignment } from '../db/schema/assignment.ts';
import {
  aiFeedbackDraft,
  assignmentGradebookCategory,
  courseGradingScheme,
  feedbackDialogue,
  feedbackDialogueMessage,
  gradeAppeal,
  gradeHistory,
  grade as gradeTable,
  gradebookCategory,
  gradebookManualGrade,
  gradebookManualItem,
  humanReview,
  publishedFeedback,
} from '../db/schema/feedback.ts';
import { courseMembership } from '../db/schema/membership.ts';
import { submission } from '../db/schema/submission.ts';

type TransactionDatabase = Parameters<Parameters<Database['transaction']>[0]>[0];
type FeedbackDatabase = Database | TransactionDatabase;

export class ManualGradebookItemUnavailableError extends Error {
  constructor() {
    super('Manual gradebook item is not active in this course.');
    this.name = 'ManualGradebookItemUnavailableError';
  }
}

export class ManualGradebookStudentUnavailableError extends Error {
  constructor() {
    super('Student is not enrolled in this course.');
    this.name = 'ManualGradebookStudentUnavailableError';
  }
}

export class ManualGradebookScoreExceedsMaxScoreError extends Error {
  constructor() {
    super('Manual gradebook grade score cannot exceed the item max score.');
    this.name = 'ManualGradebookScoreExceedsMaxScoreError';
  }
}

export const saveAiFeedbackDraft = async (
  db: Database,
  value: AiFeedbackDraftContract,
): Promise<AiFeedbackDraftContract> => {
  const parsed = AiFeedbackDraft.parse(value);
  const [row] = await db
    .insert(aiFeedbackDraft)
    .values(parsed)
    .onConflictDoNothing({
      target: [
        aiFeedbackDraft.tenantId,
        aiFeedbackDraft.submissionId,
        aiFeedbackDraft.idempotencyKey,
      ],
    })
    .returning();

  if (row) {
    return AiFeedbackDraft.parse(row);
  }

  const existing = await getAiFeedbackDraftByIdempotencyKey(
    db,
    parsed.tenantId,
    parsed.submissionId,
    parsed.idempotencyKey,
  );

  if (!existing) {
    throw new Error(
      'AI feedback draft could not be saved because the idempotency conflict could not be resolved.',
    );
  }

  return existing;
};

export const getAiFeedbackDraftById = async (
  db: Database,
  tenantId: string,
  aiFeedbackDraftId: string,
): Promise<AiFeedbackDraftContract | null> => {
  const [row] = await db
    .select()
    .from(aiFeedbackDraft)
    .where(eq(aiFeedbackDraft.id, aiFeedbackDraftId))
    .limit(1);

  if (!row || row.tenantId !== tenantId) {
    return null;
  }

  return AiFeedbackDraft.parse(row);
};

export const getAiFeedbackDraftByIdempotencyKey = async (
  db: Database,
  tenantId: string,
  submissionId: string,
  idempotencyKey: string,
): Promise<AiFeedbackDraftContract | null> => {
  const [row] = await db
    .select()
    .from(aiFeedbackDraft)
    .where(
      and(
        eq(aiFeedbackDraft.tenantId, tenantId),
        eq(aiFeedbackDraft.submissionId, submissionId),
        eq(aiFeedbackDraft.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return row ? AiFeedbackDraft.parse(row) : null;
};

export const listPendingAiFeedbackDraftsForReview = async (
  db: Database,
  tenantId: string,
): Promise<AiFeedbackDraftContract[]> => {
  const rows = await db
    .select()
    .from(aiFeedbackDraft)
    .where(and(eq(aiFeedbackDraft.tenantId, tenantId), eq(aiFeedbackDraft.status, 'generated')))
    .orderBy(aiFeedbackDraft.createdAt);

  return rows.map((row) => AiFeedbackDraft.parse(row));
};

export const saveHumanReview = async (
  db: Database,
  value: HumanReviewContract,
): Promise<HumanReviewContract> => {
  const parsed = HumanReview.parse(value);
  const [row] = await db.insert(humanReview).values(parsed).returning();

  if (!row) {
    throw new Error('Human review could not be saved because the database returned no row.');
  }

  return HumanReview.parse(row);
};

export type TransitionAiFeedbackDraftAfterReviewInput = {
  tenantId: string;
  aiFeedbackDraftId: string;
  decision: HumanReviewDecision;
};

const statusForReviewDecision = (
  decision: HumanReviewDecision,
): AiFeedbackDraftContract['status'] => {
  if (decision === 'reject') {
    return 'rejected';
  }

  if (decision === 'request_regeneration') {
    return 'superseded';
  }

  return 'reviewed';
};

export const transitionAiFeedbackDraftAfterReview = async (
  db: Database,
  input: TransitionAiFeedbackDraftAfterReviewInput,
): Promise<AiFeedbackDraftContract> => {
  const [row] = await db
    .update(aiFeedbackDraft)
    .set({ status: statusForReviewDecision(input.decision) })
    .where(
      and(
        eq(aiFeedbackDraft.tenantId, input.tenantId),
        eq(aiFeedbackDraft.id, input.aiFeedbackDraftId),
        eq(aiFeedbackDraft.status, 'generated'),
      ),
    )
    .returning();

  if (!row) {
    throw new Error(
      'AI feedback draft could not be transitioned because it was not found or is no longer awaiting review.',
    );
  }

  return AiFeedbackDraft.parse(row);
};

export const saveGrade = async (db: Database, value: GradeContract): Promise<GradeContract> => {
  const parsed = Grade.parse(value);
  const [row] = await db.insert(gradeTable).values(parsed).returning();

  if (!row) {
    throw new Error('Grade could not be saved because the database returned no row.');
  }

  return Grade.parse(row);
};

export type UpdateGradeInput = {
  tenantId: string;
  gradeId: string;
  score: number;
  maxScore: number;
  status: GradeStatus;
  updatedAt: Date;
};

export const updateGrade = async (
  db: Database,
  input: UpdateGradeInput,
): Promise<GradeContract> => {
  const [row] = await db
    .update(gradeTable)
    .set({
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      updatedAt: input.updatedAt,
    })
    .where(and(eq(gradeTable.tenantId, input.tenantId), eq(gradeTable.id, input.gradeId)))
    .returning();

  if (!row) {
    throw new Error('Grade could not be updated because it was not found.');
  }

  return Grade.parse(row);
};

export type UpsertSubmissionGradeInput = {
  tenantId: string;
  submissionId: string;
  score: number;
  maxScore: number;
  status: GradeStatus;
  source: GradeSource;
  actorId?: string | null;
  reason?: string | null;
};

// Upserts a grade for a submission. If a grade already exists for the
// submission the existing row is updated in place; otherwise a new row is
// inserted. The unique key is (tenantId, submissionId).
export const upsertSubmissionGrade = async (
  db: Database,
  input: UpsertSubmissionGradeInput,
  now = new Date(),
): Promise<GradeContract> => {
  return db.transaction(async (tx) => {
    const existing = await getGradeBySubmissionId(tx, input.tenantId, input.submissionId);
    let grade: GradeContract;

    if (existing) {
      const [row] = await tx
        .update(gradeTable)
        .set({
          score: input.score,
          maxScore: input.maxScore,
          status: input.status,
          source: input.source,
          updatedAt: now,
        })
        .where(and(eq(gradeTable.tenantId, input.tenantId), eq(gradeTable.id, existing.id)))
        .returning();

      if (!row) {
        throw new Error('Grade could not be updated because the database returned no row.');
      }

      grade = Grade.parse(row);
    } else {
      const [row] = await tx
        .insert(gradeTable)
        .values({
          id: GradeId.parse(ulid()),
          tenantId: TenantId.parse(input.tenantId),
          submissionId: SubmissionId.parse(input.submissionId),
          score: input.score,
          maxScore: input.maxScore,
          status: input.status,
          source: input.source,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!row) {
        throw new Error('Grade could not be saved because the database returned no row.');
      }

      grade = Grade.parse(row);
    }

    await recordGradeHistory(tx, {
      tenantId: input.tenantId,
      gradeId: grade.id,
      submissionId: input.submissionId,
      actorId: input.actorId ?? null,
      previousGrade: existing,
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      source: input.source,
      reason: input.reason ?? null,
      createdAt: now,
    });

    return grade;
  });
};

export type RecordGradeHistoryInput = {
  tenantId: string;
  gradeId: string;
  submissionId: string;
  actorId: string | null;
  previousGrade: GradeContract | null;
  score: number;
  maxScore: number;
  status: GradeStatus;
  source: GradeSource;
  reason: string | null;
  createdAt: Date;
};

export const recordGradeHistory = async (
  db: FeedbackDatabase,
  input: RecordGradeHistoryInput,
): Promise<GradeHistoryContract> => {
  const parsed = GradeHistory.parse({
    id: GradeHistoryId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    gradeId: GradeId.parse(input.gradeId),
    submissionId: SubmissionId.parse(input.submissionId),
    actorId: input.actorId === null ? null : UserId.parse(input.actorId),
    previousScore: input.previousGrade?.score ?? null,
    previousMaxScore: input.previousGrade?.maxScore ?? null,
    previousStatus: input.previousGrade?.status ?? null,
    previousSource: input.previousGrade?.source ?? null,
    score: input.score,
    maxScore: input.maxScore,
    status: input.status,
    source: input.source,
    reason: input.reason,
    createdAt: input.createdAt,
  });

  const [row] = await db.insert(gradeHistory).values(parsed).returning();

  if (!row) {
    throw new Error('Grade history could not be saved because the database returned no row.');
  }

  return GradeHistory.parse(row);
};

export const getGradeBySubmissionId = async (
  db: FeedbackDatabase,
  tenantId: string,
  submissionId: string,
): Promise<GradeContract | null> => {
  const [row] = await db
    .select()
    .from(gradeTable)
    .where(and(eq(gradeTable.tenantId, tenantId), eq(gradeTable.submissionId, submissionId)))
    .limit(1);

  return row ? Grade.parse(row) : null;
};

export const listGradesForTenant = async (
  db: Database,
  tenantId: string,
): Promise<GradeContract[]> => {
  const rows = await db
    .select()
    .from(gradeTable)
    .where(eq(gradeTable.tenantId, tenantId))
    .orderBy(gradeTable.createdAt);

  return rows.map((row) => Grade.parse(row));
};

export type ListGradeHistoryForSubmissionInput = {
  tenantId: string;
  submissionId: string;
};

export const listGradeHistoryForSubmission = async (
  db: Database,
  input: ListGradeHistoryForSubmissionInput,
): Promise<GradeHistoryContract[]> => {
  const rows = await db
    .select()
    .from(gradeHistory)
    .where(
      and(
        eq(gradeHistory.tenantId, input.tenantId),
        eq(gradeHistory.submissionId, input.submissionId),
      ),
    )
    .orderBy(desc(gradeHistory.createdAt), desc(gradeHistory.id));

  return rows.map((row) => GradeHistory.parse(row));
};

export type CreateGradeAppealInput = {
  tenantId: string;
  gradeId: string;
  submissionId: string;
  studentId: string;
  reason: string;
};

export const createGradeAppeal = async (
  db: Database,
  input: CreateGradeAppealInput,
  now = new Date(),
): Promise<GradeAppealContract> => {
  const parsed = GradeAppeal.parse({
    id: GradeAppealId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    gradeId: GradeId.parse(input.gradeId),
    submissionId: SubmissionId.parse(input.submissionId),
    studentId: UserId.parse(input.studentId),
    status: 'open',
    reason: input.reason,
    resolution: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  });

  const [row] = await db.insert(gradeAppeal).values(parsed).returning();

  if (!row) {
    throw new Error('Grade appeal could not be created because the database returned no row.');
  }

  return GradeAppeal.parse(row);
};

export const getGradeAppealById = async (
  db: Database,
  tenantId: string,
  gradeAppealId: string,
): Promise<GradeAppealContract | null> => {
  const [row] = await db
    .select()
    .from(gradeAppeal)
    .where(and(eq(gradeAppeal.tenantId, tenantId), eq(gradeAppeal.id, gradeAppealId)))
    .limit(1);

  return row ? GradeAppeal.parse(row) : null;
};

export type ListGradeAppealsForCourseInput = {
  tenantId: string;
  submissionIds: string[];
  studentId?: string;
};

export const listGradeAppealsForCourse = async (
  db: Database,
  input: ListGradeAppealsForCourseInput,
): Promise<GradeAppealContract[]> => {
  if (input.submissionIds.length === 0) {
    return [];
  }

  const conditions = [
    eq(gradeAppeal.tenantId, input.tenantId),
    inArray(gradeAppeal.submissionId, input.submissionIds),
  ];

  if (input.studentId) {
    conditions.push(eq(gradeAppeal.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(gradeAppeal)
    .where(and(...conditions))
    .orderBy(desc(gradeAppeal.createdAt), desc(gradeAppeal.id));

  return rows.map((row) => GradeAppeal.parse(row));
};

export type UpdateGradeAppealStatusInput = {
  tenantId: string;
  gradeAppealId: string;
  status: GradeAppealStatus;
  resolution: string | null;
};

export const updateGradeAppealStatus = async (
  db: Database,
  input: UpdateGradeAppealStatusInput,
  now = new Date(),
): Promise<GradeAppealContract | null> => {
  const terminal = input.status === 'resolved' || input.status === 'rejected';
  const [row] = await db
    .update(gradeAppeal)
    .set({
      status: input.status,
      resolution: input.resolution,
      updatedAt: now,
      resolvedAt: terminal ? now : null,
    })
    .where(and(eq(gradeAppeal.tenantId, input.tenantId), eq(gradeAppeal.id, input.gradeAppealId)))
    .returning();

  return row ? GradeAppeal.parse(row) : null;
};

export type CreateGradebookCategoryInput = {
  tenantId: string;
  courseId: string;
  name: string;
  position: number;
  weightPercent: number | null;
  dropLowest: number;
  status: GradebookCategoryStatus;
};

export const createGradebookCategory = async (
  db: Database,
  input: CreateGradebookCategoryInput,
  now = new Date(),
): Promise<GradebookCategoryContract> => {
  const parsed = GradebookCategory.parse({
    id: GradebookCategoryId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    name: input.name,
    position: input.position,
    weightPercent: input.weightPercent,
    dropLowest: input.dropLowest,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(gradebookCategory).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Gradebook category could not be created because the database returned no row.',
    );
  }

  return GradebookCategory.parse(row);
};

export type UpdateGradebookCategoryInput = {
  tenantId: string;
  courseId: string;
  gradebookCategoryId: string;
  name: string;
  position: number;
  weightPercent: number | null;
  dropLowest: number;
  status: GradebookCategoryStatus;
};

export const updateGradebookCategory = async (
  db: Database,
  input: UpdateGradebookCategoryInput,
  now = new Date(),
): Promise<GradebookCategoryContract | null> => {
  const [row] = await db
    .update(gradebookCategory)
    .set({
      name: input.name,
      position: input.position,
      weightPercent: input.weightPercent,
      dropLowest: input.dropLowest,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(gradebookCategory.tenantId, input.tenantId),
        eq(gradebookCategory.courseId, input.courseId),
        eq(gradebookCategory.id, input.gradebookCategoryId),
      ),
    )
    .returning();

  return row ? GradebookCategory.parse(row) : null;
};

export type DeleteGradebookCategoryInput = {
  tenantId: string;
  courseId: string;
  gradebookCategoryId: string;
};

export const deleteGradebookCategory = async (
  db: Database,
  input: DeleteGradebookCategoryInput,
): Promise<boolean> => {
  const result = await db
    .delete(gradebookCategory)
    .where(
      and(
        eq(gradebookCategory.tenantId, input.tenantId),
        eq(gradebookCategory.courseId, input.courseId),
        eq(gradebookCategory.id, input.gradebookCategoryId),
      ),
    )
    .returning({ id: gradebookCategory.id });

  return result.length > 0;
};

export type ListGradebookCategoriesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: GradebookCategoryStatus[];
};

export const listGradebookCategoriesForCourse = async (
  db: Database,
  input: ListGradebookCategoriesForCourseInput,
): Promise<GradebookCategoryContract[]> => {
  const rows = await db
    .select()
    .from(gradebookCategory)
    .where(
      and(
        eq(gradebookCategory.tenantId, input.tenantId),
        eq(gradebookCategory.courseId, input.courseId),
        inArray(gradebookCategory.status, input.statuses),
      ),
    )
    .orderBy(asc(gradebookCategory.position), asc(gradebookCategory.name));

  return rows.map((row) => GradebookCategory.parse(row));
};

export type CreateCourseGradingSchemeInput = {
  tenantId: string;
  courseId: string;
  name: string;
  status: CourseGradingSchemeStatus;
  entries: CourseGradingSchemeEntry[];
};

export const createCourseGradingScheme = async (
  db: Database,
  input: CreateCourseGradingSchemeInput,
  now = new Date(),
): Promise<CourseGradingSchemeContract> => {
  const parsed = CourseGradingScheme.parse({
    id: CourseGradingSchemeId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    name: input.name,
    status: input.status,
    entries: input.entries,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseGradingScheme).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Course grading scheme could not be created because the database returned no row.',
    );
  }

  return CourseGradingScheme.parse(row);
};

export type ListCourseGradingSchemesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseGradingSchemeStatus[];
};

export const listCourseGradingSchemesForCourse = async (
  db: Database,
  input: ListCourseGradingSchemesForCourseInput,
): Promise<CourseGradingSchemeContract[]> => {
  const rows = await db
    .select()
    .from(courseGradingScheme)
    .where(
      and(
        eq(courseGradingScheme.tenantId, input.tenantId),
        eq(courseGradingScheme.courseId, input.courseId),
        inArray(courseGradingScheme.status, input.statuses),
      ),
    )
    .orderBy(asc(courseGradingScheme.name), asc(courseGradingScheme.id));

  return rows.map((row) => CourseGradingScheme.parse(row));
};

export type CreateGradebookManualItemInput = {
  tenantId: string;
  courseId: string;
  gradebookCategoryId: string | null;
  title: string;
  description: string | null;
  maxScore: number;
  dueAt: Date | null;
  position: number;
  status: GradebookManualItemStatus;
  extraCredit?: boolean;
};

export const createGradebookManualItem = async (
  db: Database,
  input: CreateGradebookManualItemInput,
  now = new Date(),
): Promise<GradebookManualItemContract> => {
  const parsed = GradebookManualItem.parse({
    id: GradebookManualItemId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    gradebookCategoryId:
      input.gradebookCategoryId === null
        ? null
        : GradebookCategoryId.parse(input.gradebookCategoryId),
    title: input.title,
    description: input.description,
    maxScore: input.maxScore,
    dueAt: input.dueAt,
    position: input.position,
    status: input.status,
    extraCredit: input.extraCredit ?? false,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(gradebookManualItem).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Manual gradebook item could not be created because the database returned no row.',
    );
  }

  return GradebookManualItem.parse(row);
};

export type ListGradebookManualItemsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: GradebookManualItemStatus[];
};

export const listGradebookManualItemsForCourse = async (
  db: Database,
  input: ListGradebookManualItemsForCourseInput,
): Promise<GradebookManualItemContract[]> => {
  const rows = await db
    .select()
    .from(gradebookManualItem)
    .where(
      and(
        eq(gradebookManualItem.tenantId, input.tenantId),
        eq(gradebookManualItem.courseId, input.courseId),
        inArray(gradebookManualItem.status, input.statuses),
      ),
    )
    .orderBy(
      asc(gradebookManualItem.position),
      asc(gradebookManualItem.title),
      asc(gradebookManualItem.id),
    );

  return rows.map((row) => GradebookManualItem.parse(row));
};

export const getGradebookManualItemForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  gradebookManualItemId: string,
): Promise<GradebookManualItemContract | null> => {
  const [row] = await db
    .select()
    .from(gradebookManualItem)
    .where(
      and(
        eq(gradebookManualItem.tenantId, tenantId),
        eq(gradebookManualItem.courseId, courseId),
        eq(gradebookManualItem.id, gradebookManualItemId),
      ),
    )
    .limit(1);

  return row ? GradebookManualItem.parse(row) : null;
};

export type UpdateGradebookManualItemInput = {
  tenantId: string;
  courseId: string;
  gradebookManualItemId: string;
  gradebookCategoryId: string | null;
  title: string;
  description: string | null;
  maxScore: number;
  dueAt: Date | null;
  position: number;
  status: GradebookManualItemStatus;
  extraCredit?: boolean;
};

export const updateGradebookManualItem = async (
  db: Database,
  input: UpdateGradebookManualItemInput,
  now = new Date(),
): Promise<GradebookManualItemContract | null> => {
  const [row] = await db
    .update(gradebookManualItem)
    .set({
      gradebookCategoryId:
        input.gradebookCategoryId === null
          ? null
          : GradebookCategoryId.parse(input.gradebookCategoryId),
      title: input.title,
      description: input.description,
      maxScore: input.maxScore,
      dueAt: input.dueAt,
      position: input.position,
      status: input.status,
      extraCredit: input.extraCredit ?? false,
      updatedAt: now,
    })
    .where(
      and(
        eq(gradebookManualItem.tenantId, input.tenantId),
        eq(gradebookManualItem.courseId, input.courseId),
        eq(gradebookManualItem.id, input.gradebookManualItemId),
      ),
    )
    .returning();

  return row ? GradebookManualItem.parse(row) : null;
};

export type DeleteGradebookManualItemInput = {
  tenantId: string;
  courseId: string;
  gradebookManualItemId: string;
};

export const deleteGradebookManualItem = async (
  db: Database,
  input: DeleteGradebookManualItemInput,
): Promise<boolean> => {
  const result = await db
    .delete(gradebookManualItem)
    .where(
      and(
        eq(gradebookManualItem.tenantId, input.tenantId),
        eq(gradebookManualItem.courseId, input.courseId),
        eq(gradebookManualItem.id, input.gradebookManualItemId),
      ),
    )
    .returning({ id: gradebookManualItem.id });

  return result.length > 0;
};

export type ListGradebookManualGradesForItemInput = {
  tenantId: string;
  gradebookManualItemId: string;
  studentId?: string;
  statuses: GradeStatus[];
};

export const listGradebookManualGradesForItem = async (
  db: Database,
  input: ListGradebookManualGradesForItemInput,
): Promise<GradebookManualGradeContract[]> => {
  const conditions = [
    eq(gradebookManualGrade.tenantId, input.tenantId),
    eq(gradebookManualGrade.gradebookManualItemId, input.gradebookManualItemId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(gradebookManualGrade.status, input.statuses));
  }

  if (input.studentId) {
    conditions.push(eq(gradebookManualGrade.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(gradebookManualGrade)
    .where(and(...conditions))
    .orderBy(asc(gradebookManualGrade.studentId), asc(gradebookManualGrade.gradedAt));

  return rows.map((row) => GradebookManualGrade.parse(row));
};

export type RecordGradebookManualGradeInput = {
  tenantId: string;
  courseId: string;
  gradebookManualItemId: string;
  studentId: string;
  score: number;
  status: Extract<GradeStatus, 'draft' | 'published' | 'incomplete'>;
};

export const recordGradebookManualGrade = async (
  db: Database,
  input: RecordGradebookManualGradeInput,
  now = new Date(),
): Promise<GradebookManualGradeContract> => {
  const tenantId = TenantId.parse(input.tenantId);
  const courseId = CourseId.parse(input.courseId);
  const gradebookManualItemId = GradebookManualItemId.parse(input.gradebookManualItemId);
  const studentId = UserId.parse(input.studentId);

  return db.transaction(async (tx) => {
    const [item] = await tx.execute(sql`
      SELECT max_score
      FROM ${gradebookManualItem}
      WHERE tenant_id = ${tenantId}
        AND course_id = ${courseId}
        AND id = ${gradebookManualItemId}
        AND status = 'active'
      FOR UPDATE
    `);

    if (!item) {
      throw new ManualGradebookItemUnavailableError();
    }

    const maxScore = Number(item.max_score);

    if (input.score > maxScore) {
      throw new ManualGradebookScoreExceedsMaxScoreError();
    }

    const [studentMembership] = await tx.execute(sql`
      SELECT id
      FROM ${courseMembership}
      WHERE tenant_id = ${tenantId}
        AND course_id = ${courseId}
        AND user_id = ${studentId}
        AND role = 'student'
      FOR UPDATE
    `);

    if (!studentMembership) {
      throw new ManualGradebookStudentUnavailableError();
    }

    const parsed = GradebookManualGrade.parse({
      id: GradebookManualGradeId.parse(ulid()),
      tenantId,
      gradebookManualItemId,
      studentId,
      score: input.score,
      maxScore,
      status: input.status,
      source: 'manual',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await tx
      .insert(gradebookManualGrade)
      .values(parsed)
      .onConflictDoUpdate({
        target: [
          gradebookManualGrade.tenantId,
          gradebookManualGrade.gradebookManualItemId,
          gradebookManualGrade.studentId,
        ],
        set: {
          score: parsed.score,
          maxScore: parsed.maxScore,
          status: parsed.status,
          source: parsed.source,
          gradedAt: parsed.gradedAt,
          updatedAt: parsed.updatedAt,
        },
      })
      .returning();

    if (!row) {
      throw new Error(
        'Manual gradebook grade could not be saved because the database returned no row.',
      );
    }

    return GradebookManualGrade.parse(row);
  });
};

export type ListGradebookEntriesForCourseInput = {
  tenantId: string;
  courseId: string;
  studentId?: string;
  statuses: GradeStatus[];
};

export const listGradebookEntriesForCourse = async (
  db: Database,
  input: ListGradebookEntriesForCourseInput,
): Promise<GradebookEntryContract[]> => {
  const conditions = [
    eq(gradeTable.tenantId, input.tenantId),
    eq(assignment.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(gradeTable.status, input.statuses));
  }

  if (input.studentId) {
    conditions.push(eq(submission.studentId, input.studentId));
  }

  const rows = await db
    .select({
      gradeId: gradeTable.id,
      tenantId: gradeTable.tenantId,
      courseId: assignment.courseId,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      assignmentDueAt: assignment.dueAt,
      assignmentExtraCredit: assignment.extraCredit,
      gradebookCategoryId: gradebookCategory.id,
      gradebookCategoryName: gradebookCategory.name,
      studentId: submission.studentId,
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
      score: gradeTable.score,
      maxScore: gradeTable.maxScore,
      gradeStatus: gradeTable.status,
      gradeSource: gradeTable.source,
      gradedAt: gradeTable.updatedAt,
    })
    .from(gradeTable)
    .innerJoin(
      submission,
      and(eq(submission.tenantId, gradeTable.tenantId), eq(submission.id, gradeTable.submissionId)),
    )
    .innerJoin(
      assignment,
      and(eq(assignment.tenantId, submission.tenantId), eq(assignment.id, submission.assignmentId)),
    )
    .leftJoin(
      assignmentGradebookCategory,
      and(
        eq(assignmentGradebookCategory.tenantId, assignment.tenantId),
        eq(assignmentGradebookCategory.courseId, assignment.courseId),
        eq(assignmentGradebookCategory.assignmentId, assignment.id),
      ),
    )
    .leftJoin(
      gradebookCategory,
      and(
        eq(gradebookCategory.tenantId, assignmentGradebookCategory.tenantId),
        eq(gradebookCategory.courseId, assignmentGradebookCategory.courseId),
        eq(gradebookCategory.id, assignmentGradebookCategory.gradebookCategoryId),
      ),
    )
    .where(and(...conditions))
    .orderBy(
      sql`${assignment.dueAt} asc nulls last`,
      asc(assignment.title),
      asc(submission.studentId),
    );

  return rows.map((row) =>
    GradebookEntry.parse({
      id: `gradebook_entry:${row.gradeId}`,
      tenantId: row.tenantId,
      courseId: row.courseId,
      assignmentId: row.assignmentId,
      assignmentTitle: row.assignmentTitle,
      assignmentDueAt: row.assignmentDueAt,
      assignmentExtraCredit: row.assignmentExtraCredit,
      gradebookCategoryId: row.gradebookCategoryId,
      gradebookCategoryName: row.gradebookCategoryName,
      studentId: row.studentId,
      submissionId: row.submissionId,
      submittedAt: row.submittedAt,
      gradeId: row.gradeId,
      score: row.score,
      maxScore: row.maxScore,
      gradeStatus: row.gradeStatus,
      gradeSource: row.gradeSource,
      gradedAt: row.gradedAt,
    }),
  );
};

export const savePublishedFeedback = async (
  db: Database,
  value: PublishedFeedbackContract,
): Promise<PublishedFeedbackContract> => {
  const parsed = PublishedFeedback.parse(value);
  const [submissionRow] = await db
    .select({ id: submission.id })
    .from(submission)
    .where(and(eq(submission.tenantId, parsed.tenantId), eq(submission.id, parsed.submissionId)))
    .limit(1);

  if (!submissionRow) {
    throw new Error(
      'Published feedback references a submission that was not found in this tenant. Refresh the submission and retry.',
    );
  }

  if (parsed.humanReviewId) {
    const [reviewRow] = await db
      .select({ id: humanReview.id, aiFeedbackDraftId: humanReview.aiFeedbackDraftId })
      .from(humanReview)
      .where(
        and(eq(humanReview.tenantId, parsed.tenantId), eq(humanReview.id, parsed.humanReviewId)),
      )
      .limit(1);

    if (!reviewRow) {
      throw new Error(
        'Published feedback references a human review that was not found in this tenant. Refresh the review and retry.',
      );
    }

    const [draftRow] = await db
      .select({ id: aiFeedbackDraft.id, submissionId: aiFeedbackDraft.submissionId })
      .from(aiFeedbackDraft)
      .where(
        and(
          eq(aiFeedbackDraft.tenantId, parsed.tenantId),
          eq(aiFeedbackDraft.id, reviewRow.aiFeedbackDraftId),
        ),
      )
      .limit(1);

    if (!draftRow) {
      throw new Error(
        'Published feedback references a human review whose AI feedback draft was not found. Refresh the review and retry.',
      );
    }

    if (draftRow.submissionId !== parsed.submissionId) {
      throw new Error(
        'Published feedback references a human review for a different submission. Select a review for the same submission and retry.',
      );
    }
  }

  if (parsed.linkedGradeId) {
    const [gradeRow] = await db
      .select({ id: gradeTable.id, submissionId: gradeTable.submissionId })
      .from(gradeTable)
      .where(and(eq(gradeTable.tenantId, parsed.tenantId), eq(gradeTable.id, parsed.linkedGradeId)))
      .limit(1);

    if (!gradeRow) {
      throw new Error(
        'Published feedback references a grade that was not found in this tenant. Refresh the gradebook and retry.',
      );
    }

    if (gradeRow.submissionId !== parsed.submissionId) {
      throw new Error(
        'Published feedback references a grade for a different submission. Select a grade for the same submission and retry.',
      );
    }
  }

  const [row] = await db.insert(publishedFeedback).values(parsed).returning();

  if (!row) {
    throw new Error('Published feedback could not be saved because the database returned no row.');
  }

  return PublishedFeedback.parse(row);
};

export const getPublishedFeedbackByHumanReviewId = async (
  db: Database,
  tenantId: string,
  humanReviewId: string,
): Promise<PublishedFeedbackContract | null> => {
  const [row] = await db
    .select()
    .from(publishedFeedback)
    .where(
      and(
        eq(publishedFeedback.tenantId, tenantId),
        eq(publishedFeedback.humanReviewId, humanReviewId),
      ),
    )
    .limit(1);

  return row ? PublishedFeedback.parse(row) : null;
};

export const getLatestPublishedFeedbackForSubmission = async (
  db: Database,
  tenantId: string,
  submissionId: string,
): Promise<PublishedFeedbackContract | null> => {
  const [row] = await db
    .select()
    .from(publishedFeedback)
    .where(
      and(
        eq(publishedFeedback.tenantId, tenantId),
        eq(publishedFeedback.submissionId, submissionId),
      ),
    )
    .orderBy(desc(publishedFeedback.version))
    .limit(1);

  return row ? PublishedFeedback.parse(row) : null;
};

export const saveFeedbackDialogue = async (
  db: Database,
  value: FeedbackDialogueContract,
): Promise<FeedbackDialogueContract> => {
  const parsed = FeedbackDialogue.parse(value);
  const [row] = await db.insert(feedbackDialogue).values(parsed).returning();

  if (!row) {
    throw new Error('Feedback dialogue could not be saved because the database returned no row.');
  }

  return FeedbackDialogue.parse(row);
};

export const saveFeedbackDialogueMessage = async (
  db: Database,
  value: FeedbackDialogueMessageContract,
): Promise<FeedbackDialogueMessageContract> => {
  const parsed = FeedbackDialogueMessage.parse(value);
  const [row] = await db.insert(feedbackDialogueMessage).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Feedback dialogue message could not be saved because the database returned no row.',
    );
  }

  return FeedbackDialogueMessage.parse(row);
};

export type ListFeedbackDialogueMessagesInput = {
  tenantId: string;
  dialogueId: string;
};

export const listFeedbackDialogueMessages = async (
  db: Database,
  input: ListFeedbackDialogueMessagesInput,
): Promise<FeedbackDialogueMessageContract[]> => {
  const rows = await db
    .select()
    .from(feedbackDialogueMessage)
    .where(
      and(
        eq(feedbackDialogueMessage.tenantId, input.tenantId),
        eq(feedbackDialogueMessage.dialogueId, input.dialogueId),
      ),
    )
    .orderBy(asc(feedbackDialogueMessage.createdAt), asc(feedbackDialogueMessage.id));

  return rows.map((row) => FeedbackDialogueMessage.parse(row));
};
