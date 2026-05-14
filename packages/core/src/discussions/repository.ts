import {
  CourseId,
  CourseModuleId,
  CourseUnitId,
  DiscussionGradebookEntry,
  type DiscussionGradebookEntry as DiscussionGradebookEntryContract,
  DiscussionPost,
  type DiscussionPost as DiscussionPostContract,
  DiscussionPostGrade,
  type DiscussionPostGrade as DiscussionPostGradeContract,
  DiscussionPostGradeId,
  type DiscussionPostGradeStatus,
  DiscussionPostId,
  type DiscussionPostStatus,
  DiscussionTopic,
  type DiscussionTopic as DiscussionTopicContract,
  DiscussionTopicId,
  DiscussionTopicSubscription,
  type DiscussionTopicSubscription as DiscussionTopicSubscriptionContract,
  DiscussionTopicSubscriptionId,
  type DiscussionTopicVisibility,
  RubricId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import {
  discussionPost,
  discussionPostGrade,
  discussionTopic,
  discussionTopicSubscription,
} from '../db/schema/discussion.ts';

export type ListDiscussionTopicsForCourseInput = {
  tenantId: string;
  courseId: string;
  visibilities?: DiscussionTopicVisibility[];
  moduleId?: string;
  unitId?: string;
};

export type CreateDiscussionTopicInput = {
  tenantId: string;
  courseId: string;
  moduleId: string | null;
  unitId: string | null;
  title: string;
  prompt: string | null;
  visibility: DiscussionTopicVisibility;
  position: number;
  gradingEnabled?: boolean;
  pointsPossible?: number | null;
  rubricId?: string | null;
};

export const listDiscussionTopicsForCourse = async (
  db: Database,
  input: ListDiscussionTopicsForCourseInput,
): Promise<DiscussionTopicContract[]> => {
  const conditions = [
    eq(discussionTopic.tenantId, input.tenantId),
    eq(discussionTopic.courseId, input.courseId),
  ];

  if (input.visibilities && input.visibilities.length > 0) {
    conditions.push(inArray(discussionTopic.visibility, input.visibilities));
  }
  if (input.moduleId) {
    conditions.push(eq(discussionTopic.moduleId, input.moduleId));
  }
  if (input.unitId) {
    conditions.push(eq(discussionTopic.unitId, input.unitId));
  }

  const rows = await db
    .select()
    .from(discussionTopic)
    .where(and(...conditions))
    .orderBy(asc(discussionTopic.position), asc(discussionTopic.title));

  return rows.map((row) => DiscussionTopic.parse(row));
};

export const createDiscussionTopic = async (
  db: Database,
  input: CreateDiscussionTopicInput,
  now = new Date(),
): Promise<DiscussionTopicContract> => {
  const parsed = DiscussionTopic.parse({
    id: DiscussionTopicId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: input.moduleId ? CourseModuleId.parse(input.moduleId) : null,
    unitId: input.unitId ? CourseUnitId.parse(input.unitId) : null,
    title: input.title,
    prompt: input.prompt,
    visibility: input.visibility,
    position: input.position,
    gradingEnabled: input.gradingEnabled ?? false,
    pointsPossible: input.pointsPossible ?? null,
    rubricId: input.rubricId ? RubricId.parse(input.rubricId) : null,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(discussionTopic).values(parsed).returning();

  if (!row) {
    throw new Error('Discussion topic could not be created because the database returned no row.');
  }

  return DiscussionTopic.parse(row);
};

export type UpdateDiscussionTopicInput = {
  tenantId: string;
  courseId: string;
  topicId: string;
  moduleId: string | null;
  unitId: string | null;
  title: string;
  prompt: string | null;
  visibility: DiscussionTopicVisibility;
  position: number;
  gradingEnabled?: boolean;
  pointsPossible?: number | null;
  rubricId?: string | null;
};

export const updateDiscussionTopic = async (
  db: Database,
  input: UpdateDiscussionTopicInput,
  now = new Date(),
): Promise<DiscussionTopicContract | null> => {
  const [row] = await db
    .update(discussionTopic)
    .set({
      moduleId: input.moduleId ? CourseModuleId.parse(input.moduleId) : null,
      unitId: input.unitId ? CourseUnitId.parse(input.unitId) : null,
      title: input.title,
      prompt: input.prompt,
      visibility: input.visibility,
      position: input.position,
      gradingEnabled: input.gradingEnabled ?? false,
      pointsPossible: input.pointsPossible ?? null,
      rubricId: input.rubricId ? RubricId.parse(input.rubricId) : null,
      updatedAt: now,
    })
    .where(
      and(
        eq(discussionTopic.tenantId, input.tenantId),
        eq(discussionTopic.courseId, input.courseId),
        eq(discussionTopic.id, input.topicId),
      ),
    )
    .returning();

  return row ? DiscussionTopic.parse(row) : null;
};

export type DeleteDiscussionTopicInput = {
  tenantId: string;
  courseId: string;
  topicId: string;
};

export const deleteDiscussionTopic = async (
  db: Database,
  input: DeleteDiscussionTopicInput,
): Promise<boolean> => {
  const result = await db
    .delete(discussionTopic)
    .where(
      and(
        eq(discussionTopic.tenantId, input.tenantId),
        eq(discussionTopic.courseId, input.courseId),
        eq(discussionTopic.id, input.topicId),
      ),
    )
    .returning({ id: discussionTopic.id });

  return result.length > 0;
};

export const getDiscussionTopicForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  topicId: string,
): Promise<DiscussionTopicContract | null> => {
  const [row] = await db
    .select()
    .from(discussionTopic)
    .where(
      and(
        eq(discussionTopic.tenantId, tenantId),
        eq(discussionTopic.courseId, courseId),
        eq(discussionTopic.id, topicId),
      ),
    )
    .limit(1);

  return row ? DiscussionTopic.parse(row) : null;
};

export type ListDiscussionPostsForTopicInput = {
  tenantId: string;
  topicId: string;
  statuses?: DiscussionPostStatus[];
};

export const listDiscussionPostsForTopic = async (
  db: Database,
  input: ListDiscussionPostsForTopicInput,
): Promise<DiscussionPostContract[]> => {
  const conditions = [
    eq(discussionPost.tenantId, input.tenantId),
    eq(discussionPost.topicId, input.topicId),
  ];

  if (input.statuses && input.statuses.length > 0) {
    conditions.push(inArray(discussionPost.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(discussionPost)
    .where(and(...conditions))
    .orderBy(asc(discussionPost.createdAt), asc(discussionPost.id));

  return rows.map((row) => DiscussionPost.parse(row));
};

export type CreateDiscussionPostInput = {
  tenantId: string;
  topicId: string;
  authorId: string;
  parentPostId?: string | null;
  body: string;
  status?: DiscussionPostStatus;
};

export const createDiscussionPost = async (
  db: DatabaseExecutor,
  input: CreateDiscussionPostInput,
  now = new Date(),
): Promise<DiscussionPostContract> => {
  const parsed = DiscussionPost.parse({
    id: DiscussionPostId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    topicId: DiscussionTopicId.parse(input.topicId),
    authorId: UserId.parse(input.authorId),
    parentPostId: input.parentPostId ? DiscussionPostId.parse(input.parentPostId) : null,
    body: input.body,
    status: input.status ?? 'published',
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(discussionPost).values(parsed).returning();

  if (!row) {
    throw new Error('Discussion post could not be created because the database returned no row.');
  }

  return DiscussionPost.parse(row);
};

export type SubscribeToDiscussionTopicInput = {
  tenantId: string;
  topicId: string;
  userId: string;
};

export const subscribeToDiscussionTopic = async (
  db: DatabaseExecutor,
  input: SubscribeToDiscussionTopicInput,
  now = new Date(),
): Promise<DiscussionTopicSubscriptionContract> => {
  const parsed = DiscussionTopicSubscription.parse({
    id: DiscussionTopicSubscriptionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    topicId: DiscussionTopicId.parse(input.topicId),
    userId: UserId.parse(input.userId),
    createdAt: now,
  });

  const [inserted] = await db
    .insert(discussionTopicSubscription)
    .values(parsed)
    .onConflictDoNothing({
      target: [
        discussionTopicSubscription.tenantId,
        discussionTopicSubscription.topicId,
        discussionTopicSubscription.userId,
      ],
    })
    .returning();

  if (inserted) {
    return DiscussionTopicSubscription.parse(inserted);
  }

  const [existing] = await db
    .select()
    .from(discussionTopicSubscription)
    .where(
      and(
        eq(discussionTopicSubscription.tenantId, input.tenantId),
        eq(discussionTopicSubscription.topicId, input.topicId),
        eq(discussionTopicSubscription.userId, input.userId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error(
      'Discussion topic subscription could not be saved because the database returned no row.',
    );
  }

  return DiscussionTopicSubscription.parse(existing);
};

export type UnsubscribeFromDiscussionTopicInput = SubscribeToDiscussionTopicInput;

export const unsubscribeFromDiscussionTopic = async (
  db: DatabaseExecutor,
  input: UnsubscribeFromDiscussionTopicInput,
): Promise<boolean> => {
  const result = await db
    .delete(discussionTopicSubscription)
    .where(
      and(
        eq(discussionTopicSubscription.tenantId, input.tenantId),
        eq(discussionTopicSubscription.topicId, input.topicId),
        eq(discussionTopicSubscription.userId, input.userId),
      ),
    )
    .returning({ id: discussionTopicSubscription.id });

  return result.length > 0;
};

export type ListDiscussionTopicSubscriptionsInput = {
  tenantId: string;
  topicId: string;
};

export const listDiscussionTopicSubscriptions = async (
  db: Database,
  input: ListDiscussionTopicSubscriptionsInput,
): Promise<DiscussionTopicSubscriptionContract[]> => {
  const rows = await db
    .select()
    .from(discussionTopicSubscription)
    .where(
      and(
        eq(discussionTopicSubscription.tenantId, input.tenantId),
        eq(discussionTopicSubscription.topicId, input.topicId),
      ),
    )
    .orderBy(asc(discussionTopicSubscription.createdAt), asc(discussionTopicSubscription.id));

  return rows.map((row) => DiscussionTopicSubscription.parse(row));
};

export const getDiscussionPostForTopic = async (
  db: Database,
  tenantId: string,
  topicId: string,
  postId: string,
): Promise<DiscussionPostContract | null> => {
  const [row] = await db
    .select()
    .from(discussionPost)
    .where(
      and(
        eq(discussionPost.tenantId, tenantId),
        eq(discussionPost.topicId, topicId),
        eq(discussionPost.id, postId),
      ),
    )
    .limit(1);

  return row ? DiscussionPost.parse(row) : null;
};

export type UpdateDiscussionPostInput = {
  tenantId: string;
  topicId: string;
  postId: string;
  body: string;
  status?: DiscussionPostStatus;
};

export const updateDiscussionPost = async (
  db: DatabaseExecutor,
  input: UpdateDiscussionPostInput,
  now = new Date(),
): Promise<DiscussionPostContract | null> => {
  const values: {
    body: string;
    updatedAt: Date;
    status?: DiscussionPostStatus;
  } = {
    body: input.body,
    updatedAt: now,
  };
  if (input.status !== undefined) {
    values.status = input.status;
  }

  const [row] = await db
    .update(discussionPost)
    .set(values)
    .where(
      and(
        eq(discussionPost.tenantId, input.tenantId),
        eq(discussionPost.topicId, input.topicId),
        eq(discussionPost.id, input.postId),
      ),
    )
    .returning();

  return row ? DiscussionPost.parse(row) : null;
};

export type DeleteDiscussionPostInput = {
  tenantId: string;
  topicId: string;
  postId: string;
};

export const deleteDiscussionPost = async (
  db: Database,
  input: DeleteDiscussionPostInput,
): Promise<boolean> => {
  const result = await db
    .delete(discussionPost)
    .where(
      and(
        eq(discussionPost.tenantId, input.tenantId),
        eq(discussionPost.topicId, input.topicId),
        eq(discussionPost.id, input.postId),
      ),
    )
    .returning({ id: discussionPost.id });

  return result.length > 0;
};

export type UpsertDiscussionPostGradeInput = {
  tenantId: string;
  topicId: string;
  postId: string;
  studentId: string;
  score: number;
  maxScore: number;
  status: DiscussionPostGradeStatus;
  comment: string | null;
  gradedByUserId: string | null;
};

export const upsertDiscussionPostGrade = async (
  db: Database,
  input: UpsertDiscussionPostGradeInput,
  now = new Date(),
): Promise<DiscussionPostGradeContract> => {
  const parsed = DiscussionPostGrade.parse({
    id: DiscussionPostGradeId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    topicId: DiscussionTopicId.parse(input.topicId),
    postId: DiscussionPostId.parse(input.postId),
    studentId: UserId.parse(input.studentId),
    score: input.score,
    maxScore: input.maxScore,
    status: input.status,
    comment: input.comment,
    gradedByUserId: input.gradedByUserId === null ? null : UserId.parse(input.gradedByUserId),
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(discussionPostGrade)
    .values(parsed)
    .onConflictDoUpdate({
      target: [discussionPostGrade.tenantId, discussionPostGrade.postId],
      set: {
        score: input.score,
        maxScore: input.maxScore,
        status: input.status,
        comment: input.comment,
        gradedByUserId: input.gradedByUserId,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Discussion post grade could not be upserted because the database returned no row.',
    );
  }
  return DiscussionPostGrade.parse(row);
};

export type ListDiscussionPostGradesForTopicInput = {
  tenantId: string;
  topicId: string;
};

export const listDiscussionPostGradesForTopic = async (
  db: Database,
  input: ListDiscussionPostGradesForTopicInput,
): Promise<DiscussionPostGradeContract[]> => {
  const rows = await db
    .select()
    .from(discussionPostGrade)
    .where(
      and(
        eq(discussionPostGrade.tenantId, input.tenantId),
        eq(discussionPostGrade.topicId, input.topicId),
      ),
    )
    .orderBy(asc(discussionPostGrade.postId));
  return rows.map((row) => DiscussionPostGrade.parse(row));
};

export type GetDiscussionPostGradeInput = {
  tenantId: string;
  postId: string;
};

export const getDiscussionPostGrade = async (
  db: Database,
  input: GetDiscussionPostGradeInput,
): Promise<DiscussionPostGradeContract | null> => {
  const [row] = await db
    .select()
    .from(discussionPostGrade)
    .where(
      and(
        eq(discussionPostGrade.tenantId, input.tenantId),
        eq(discussionPostGrade.postId, input.postId),
      ),
    )
    .limit(1);
  return row ? DiscussionPostGrade.parse(row) : null;
};

export type ListDiscussionPostGradesForStudentInput = {
  tenantId: string;
  topicId: string;
  studentId: string;
};

export const listDiscussionPostGradesForStudent = async (
  db: Database,
  input: ListDiscussionPostGradesForStudentInput,
): Promise<DiscussionPostGradeContract[]> => {
  const rows = await db
    .select()
    .from(discussionPostGrade)
    .where(
      and(
        eq(discussionPostGrade.tenantId, input.tenantId),
        eq(discussionPostGrade.topicId, input.topicId),
        eq(discussionPostGrade.studentId, input.studentId),
      ),
    )
    .orderBy(asc(discussionPostGrade.postId));
  return rows.map((row) => DiscussionPostGrade.parse(row));
};

export type ListDiscussionGradebookEntriesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses?: DiscussionPostGradeStatus[];
  studentId?: string;
};

export const listDiscussionGradebookEntriesForCourse = async (
  db: Database,
  input: ListDiscussionGradebookEntriesForCourseInput,
): Promise<DiscussionGradebookEntryContract[]> => {
  const conditions = [
    eq(discussionPostGrade.tenantId, input.tenantId),
    eq(discussionTopic.courseId, input.courseId),
  ];
  if (input.statuses && input.statuses.length > 0) {
    conditions.push(inArray(discussionPostGrade.status, input.statuses));
  }
  if (input.studentId) {
    conditions.push(eq(discussionPostGrade.studentId, input.studentId));
  }

  const rows = await db
    .select({
      gradeId: discussionPostGrade.id,
      tenantId: discussionPostGrade.tenantId,
      courseId: discussionTopic.courseId,
      topicId: discussionPostGrade.topicId,
      topicTitle: discussionTopic.title,
      postId: discussionPostGrade.postId,
      studentId: discussionPostGrade.studentId,
      score: discussionPostGrade.score,
      maxScore: discussionPostGrade.maxScore,
      status: discussionPostGrade.status,
      comment: discussionPostGrade.comment,
      gradedAt: discussionPostGrade.updatedAt,
    })
    .from(discussionPostGrade)
    .innerJoin(
      discussionTopic,
      and(
        eq(discussionTopic.tenantId, discussionPostGrade.tenantId),
        eq(discussionTopic.id, discussionPostGrade.topicId),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(discussionTopic.title), asc(discussionPostGrade.studentId));

  return rows.map((row) =>
    DiscussionGradebookEntry.parse({
      id: `discussion_gradebook_entry:${row.gradeId}`,
      tenantId: row.tenantId,
      courseId: row.courseId,
      topicId: row.topicId,
      topicTitle: row.topicTitle,
      postId: row.postId,
      gradeId: row.gradeId,
      studentId: row.studentId,
      score: row.score,
      maxScore: row.maxScore,
      status: row.status,
      comment: row.comment,
      gradedAt: row.gradedAt,
    }),
  );
};
