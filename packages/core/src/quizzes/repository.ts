import {
  CourseId,
  CourseModuleId,
  CourseUnitId,
  LearningObjectiveId,
  QuestionBank,
  type QuestionBank as QuestionBankContract,
  QuestionBankId,
  QuestionBankQuestion,
  type QuestionBankQuestion as QuestionBankQuestionContract,
  QuestionBankQuestionId,
  type QuestionBankStatus,
  Quiz,
  QuizAttempt,
  type QuizAttempt as QuizAttemptContract,
  QuizAttemptId,
  QuizAttemptProbe,
  type QuizAttemptProbe as QuizAttemptProbeContract,
  QuizAttemptProbeId,
  QuizAttemptProbeResponse,
  type QuizAttemptProbeResponse as QuizAttemptProbeResponseContract,
  QuizAttemptProbeResponseId,
  QuizAttemptQuestionGrade,
  type QuizAttemptQuestionGrade as QuizAttemptQuestionGradeContract,
  QuizAttemptQuestionGradeId,
  QuizAttemptResponse,
  type QuizAttemptResponseAnswer,
  type QuizAttemptResponse as QuizAttemptResponseContract,
  QuizAttemptResponseId,
  type Quiz as QuizContract,
  QuizId,
  QuizOverride,
  type QuizOverride as QuizOverrideContract,
  QuizOverrideId,
  type QuizOverrideStatus,
  type QuizOverrideTargetType,
  QuizQuestion,
  QuizQuestionAnswerKey,
  type QuizQuestionChoice,
  type QuizQuestion as QuizQuestionContract,
  QuizQuestionId,
  type QuizQuestionType,
  type QuizStatus,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import {
  questionBank,
  questionBankQuestion,
  quiz,
  quizAttempt,
  quizAttemptProbe,
  quizAttemptProbeResponse,
  quizAttemptQuestionGrade,
  quizAttemptResponse,
  quizOverride,
  quizQuestion,
} from '../db/schema/quiz.ts';
import type { AutoGradableQuizQuestion } from './auto-grading.ts';

type QuizRow = typeof quiz.$inferSelect;

const parseQuizRow = (row: QuizRow): QuizContract => {
  const accessPasswordHash = row.accessPasswordHash ?? null;

  return Quiz.parse({
    ...row,
    accessPasswordRequired: accessPasswordHash !== null,
    allowedIpRanges: row.allowedIpRanges ?? [],
  });
};

export type CreateQuestionBankInput = {
  tenantId: string;
  courseId: string;
  title: string;
  description: string | null;
  status: QuestionBankStatus;
};

export const createQuestionBank = async (
  db: Database,
  input: CreateQuestionBankInput,
  now = new Date(),
): Promise<QuestionBankContract> => {
  const parsed = QuestionBank.parse({
    id: QuestionBankId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    description: input.description,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(questionBank).values(parsed).returning();

  if (!row) {
    throw new Error('Question bank could not be created because the database returned no row.');
  }

  return QuestionBank.parse(row);
};

export type CreateQuizInput = {
  tenantId: string;
  courseId: string;
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  description: string | null;
  status: QuizStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  maxAttempts: number;
  accessPasswordHash: string | null;
  allowedIpRanges: string[];
};

export const createQuiz = async (
  db: Database,
  input: CreateQuizInput,
  now = new Date(),
): Promise<QuizContract> => {
  const parsed = parseQuizRow({
    id: QuizId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
    unitId: input.unitId === null ? null : CourseUnitId.parse(input.unitId),
    position: input.position,
    title: input.title,
    description: input.description,
    status: input.status,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    timeLimitMinutes: input.timeLimitMinutes,
    shuffleQuestions: input.shuffleQuestions,
    maxAttempts: input.maxAttempts,
    gradingMethod: 'best',
    proctoringRequired: false,
    accessPasswordHash: input.accessPasswordHash,
    allowedIpRanges: input.allowedIpRanges,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .insert(quiz)
    .values({
      id: parsed.id,
      tenantId: parsed.tenantId,
      courseId: parsed.courseId,
      moduleId: parsed.moduleId,
      unitId: parsed.unitId,
      position: parsed.position,
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      opensAt: parsed.opensAt,
      closesAt: parsed.closesAt,
      timeLimitMinutes: parsed.timeLimitMinutes,
      shuffleQuestions: parsed.shuffleQuestions,
      maxAttempts: parsed.maxAttempts,
      gradingMethod: parsed.gradingMethod,
      proctoringRequired: parsed.proctoringRequired,
      accessPasswordHash: input.accessPasswordHash,
      allowedIpRanges: parsed.allowedIpRanges,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    })
    .returning();

  if (!row) {
    throw new Error('Quiz could not be created because the database returned no row.');
  }

  return parseQuizRow(row);
};

export type CreateQuestionBankQuestionInput = {
  tenantId: string;
  questionBankId: string;
  position: number;
  questionType: QuizQuestionType;
  prompt: string;
  points: number;
  choices: QuizQuestionChoice[];
};

export const createQuestionBankQuestion = async (
  db: Database,
  input: CreateQuestionBankQuestionInput,
  now = new Date(),
): Promise<QuestionBankQuestionContract> => {
  const parsed = QuestionBankQuestion.parse({
    id: QuestionBankQuestionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    questionBankId: QuestionBankId.parse(input.questionBankId),
    position: input.position,
    questionType: input.questionType,
    prompt: input.prompt,
    points: input.points,
    choices: input.choices,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(questionBankQuestion).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Question bank question could not be created because the database returned no row.',
    );
  }

  return QuestionBankQuestion.parse(row);
};

export type ListQuestionBanksForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: QuestionBankStatus[];
};

export const listQuestionBanksForCourse = async (
  db: Database,
  input: ListQuestionBanksForCourseInput,
): Promise<QuestionBankContract[]> => {
  const rows = await db
    .select()
    .from(questionBank)
    .where(
      and(
        eq(questionBank.tenantId, input.tenantId),
        eq(questionBank.courseId, input.courseId),
        inArray(questionBank.status, input.statuses),
      ),
    )
    .orderBy(asc(questionBank.title), asc(questionBank.id));

  return rows.map((row) => QuestionBank.parse(row));
};

export const getQuestionBankForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  questionBankId: string,
): Promise<QuestionBankContract | null> => {
  const [row] = await db
    .select()
    .from(questionBank)
    .where(
      and(
        eq(questionBank.tenantId, tenantId),
        eq(questionBank.courseId, courseId),
        eq(questionBank.id, questionBankId),
      ),
    )
    .limit(1);

  return row ? QuestionBank.parse(row) : null;
};

export type UpdateQuestionBankInput = {
  tenantId: string;
  courseId: string;
  questionBankId: string;
  title: string;
  description: string | null;
  status: QuestionBankStatus;
};

export const updateQuestionBank = async (
  db: Database,
  input: UpdateQuestionBankInput,
  now = new Date(),
): Promise<QuestionBankContract | null> => {
  const [row] = await db
    .update(questionBank)
    .set({
      title: input.title,
      description: input.description,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(questionBank.tenantId, input.tenantId),
        eq(questionBank.courseId, input.courseId),
        eq(questionBank.id, input.questionBankId),
      ),
    )
    .returning();

  return row ? QuestionBank.parse(row) : null;
};

export type DeleteQuestionBankInput = {
  tenantId: string;
  courseId: string;
  questionBankId: string;
};

export const deleteQuestionBank = async (
  db: Database,
  input: DeleteQuestionBankInput,
): Promise<boolean> => {
  const result = await db
    .delete(questionBank)
    .where(
      and(
        eq(questionBank.tenantId, input.tenantId),
        eq(questionBank.courseId, input.courseId),
        eq(questionBank.id, input.questionBankId),
      ),
    )
    .returning({ id: questionBank.id });

  return result.length > 0;
};

export type ListQuestionBankQuestionsForBankInput = {
  tenantId: string;
  questionBankId: string;
};

export const listQuestionBankQuestionsForBank = async (
  db: Database,
  input: ListQuestionBankQuestionsForBankInput,
): Promise<QuestionBankQuestionContract[]> => {
  const rows = await db
    .select()
    .from(questionBankQuestion)
    .where(
      and(
        eq(questionBankQuestion.tenantId, input.tenantId),
        eq(questionBankQuestion.questionBankId, input.questionBankId),
      ),
    )
    .orderBy(asc(questionBankQuestion.position), asc(questionBankQuestion.id));

  return rows.map((row) => QuestionBankQuestion.parse(row));
};

export type ListQuizzesForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: QuizStatus[];
  moduleId?: string;
  unitId?: string;
};

export const listQuizzesForCourse = async (
  db: Database,
  input: ListQuizzesForCourseInput,
): Promise<QuizContract[]> => {
  const conditions = [eq(quiz.tenantId, input.tenantId), eq(quiz.courseId, input.courseId)];

  if (input.statuses.length > 0) {
    conditions.push(inArray(quiz.status, input.statuses));
  }

  if (input.moduleId) {
    conditions.push(eq(quiz.moduleId, input.moduleId));
  }

  if (input.unitId) {
    conditions.push(eq(quiz.unitId, input.unitId));
  }

  const orderExpressions =
    input.moduleId || input.unitId
      ? [sql`${quiz.position} asc nulls last`, asc(quiz.title), asc(quiz.id)]
      : [sql`${quiz.opensAt} asc nulls last`, asc(quiz.title), asc(quiz.id)];

  const rows = await db
    .select()
    .from(quiz)
    .where(and(...conditions))
    .orderBy(...orderExpressions);

  return rows.map((row) => parseQuizRow(row));
};

export const getQuizForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  quizId: string,
): Promise<QuizContract | null> => {
  const [row] = await db
    .select()
    .from(quiz)
    .where(and(eq(quiz.tenantId, tenantId), eq(quiz.courseId, courseId), eq(quiz.id, quizId)))
    .limit(1);

  return row ? parseQuizRow(row) : null;
};

export type QuizAccessControls = {
  accessPasswordHash: string | null;
  allowedIpRanges: string[];
};

export const getQuizAccessControlsForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  quizId: string,
): Promise<QuizAccessControls | null> => {
  const [row] = await db
    .select({
      accessPasswordHash: quiz.accessPasswordHash,
      allowedIpRanges: quiz.allowedIpRanges,
    })
    .from(quiz)
    .where(and(eq(quiz.tenantId, tenantId), eq(quiz.courseId, courseId), eq(quiz.id, quizId)))
    .limit(1);

  return row
    ? {
        accessPasswordHash: row.accessPasswordHash,
        allowedIpRanges: row.allowedIpRanges ?? [],
      }
    : null;
};

export type UpdateQuizInput = {
  tenantId: string;
  courseId: string;
  quizId: string;
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  description: string | null;
  status: QuizStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  maxAttempts: number;
  accessPasswordHash?: string | null;
  allowedIpRanges?: string[];
};

export const updateQuiz = async (
  db: Database,
  input: UpdateQuizInput,
  now = new Date(),
): Promise<QuizContract | null> => {
  const [row] = await db
    .update(quiz)
    .set({
      moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
      unitId: input.unitId === null ? null : CourseUnitId.parse(input.unitId),
      position: input.position,
      title: input.title,
      description: input.description,
      status: input.status,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      timeLimitMinutes: input.timeLimitMinutes,
      shuffleQuestions: input.shuffleQuestions,
      maxAttempts: input.maxAttempts,
      ...(input.accessPasswordHash !== undefined
        ? { accessPasswordHash: input.accessPasswordHash }
        : {}),
      ...(input.allowedIpRanges !== undefined ? { allowedIpRanges: input.allowedIpRanges } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(quiz.tenantId, input.tenantId),
        eq(quiz.courseId, input.courseId),
        eq(quiz.id, input.quizId),
      ),
    )
    .returning();

  return row ? parseQuizRow(row) : null;
};

export type DeleteQuizInput = {
  tenantId: string;
  courseId: string;
  quizId: string;
};

export const deleteQuiz = async (db: Database, input: DeleteQuizInput): Promise<boolean> => {
  const result = await db
    .delete(quiz)
    .where(
      and(
        eq(quiz.tenantId, input.tenantId),
        eq(quiz.courseId, input.courseId),
        eq(quiz.id, input.quizId),
      ),
    )
    .returning({ id: quiz.id });

  return result.length > 0;
};

export type ListQuizOverridesForQuizInput = {
  tenantId: string;
  quizId: string;
  statuses: QuizOverrideStatus[];
};

export const listQuizOverridesForQuiz = async (
  db: Database,
  input: ListQuizOverridesForQuizInput,
): Promise<QuizOverrideContract[]> => {
  const rows = await db
    .select()
    .from(quizOverride)
    .where(
      and(
        eq(quizOverride.tenantId, input.tenantId),
        eq(quizOverride.quizId, input.quizId),
        inArray(quizOverride.status, input.statuses),
      ),
    )
    .orderBy(asc(quizOverride.targetType), asc(quizOverride.targetId));

  return rows.map((row) => QuizOverride.parse(row));
};

export type CreateQuizOverrideInput = {
  tenantId: string;
  quizId: string;
  targetType: QuizOverrideTargetType;
  targetId: string;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  status: QuizOverrideStatus;
};

export const createQuizOverride = async (
  db: Database,
  input: CreateQuizOverrideInput,
  now = new Date(),
): Promise<QuizOverrideContract> => {
  const parsed = QuizOverride.parse({
    id: QuizOverrideId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    quizId: QuizId.parse(input.quizId),
    targetType: input.targetType,
    targetId: input.targetId,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    timeLimitMinutes: input.timeLimitMinutes,
    maxAttempts: input.maxAttempts,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(quizOverride).values(parsed).returning();

  if (!row) {
    throw new Error('Quiz override could not be created because the database returned no row.');
  }

  return QuizOverride.parse(row);
};

export const getQuizOverrideById = async (
  db: Database,
  tenantId: string,
  overrideId: string,
): Promise<QuizOverrideContract | null> => {
  const [row] = await db
    .select()
    .from(quizOverride)
    .where(and(eq(quizOverride.tenantId, tenantId), eq(quizOverride.id, overrideId)))
    .limit(1);

  return row ? QuizOverride.parse(row) : null;
};

export type UpdateQuizOverrideInput = {
  tenantId: string;
  overrideId: string;
  opensAt: Date | null;
  closesAt: Date | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  status: QuizOverrideStatus;
};

export const updateQuizOverride = async (
  db: Database,
  input: UpdateQuizOverrideInput,
  now = new Date(),
): Promise<QuizOverrideContract> => {
  const [row] = await db
    .update(quizOverride)
    .set({
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      timeLimitMinutes: input.timeLimitMinutes,
      maxAttempts: input.maxAttempts,
      status: input.status,
      updatedAt: now,
    })
    .where(and(eq(quizOverride.tenantId, input.tenantId), eq(quizOverride.id, input.overrideId)))
    .returning();

  if (!row) {
    throw new Error('Quiz override could not be updated because it was not found in this tenant.');
  }

  return QuizOverride.parse(row);
};

export type DeleteQuizOverrideInput = {
  tenantId: string;
  overrideId: string;
};

export const deleteQuizOverride = async (
  db: Database,
  input: DeleteQuizOverrideInput,
): Promise<boolean> => {
  const result = await db
    .delete(quizOverride)
    .where(and(eq(quizOverride.tenantId, input.tenantId), eq(quizOverride.id, input.overrideId)))
    .returning({ id: quizOverride.id });

  return result.length > 0;
};

export type ListQuizQuestionsForQuizInput = {
  tenantId: string;
  quizId: string;
};

export const listQuizQuestionsForQuiz = async (
  db: Database,
  input: ListQuizQuestionsForQuizInput,
): Promise<QuizQuestionContract[]> => {
  const rows = await db
    .select()
    .from(quizQuestion)
    .where(and(eq(quizQuestion.tenantId, input.tenantId), eq(quizQuestion.quizId, input.quizId)))
    .orderBy(asc(quizQuestion.position));

  return rows.map((row) => QuizQuestion.parse(row));
};

export type CreateQuizQuestionInput = {
  tenantId: string;
  quizId: string;
  position: number;
  questionType: QuizQuestionType;
  prompt: string;
  points: number;
  choices: QuizQuestionChoice[];
  answerKey?: QuizQuestionAnswerKey | null;
};

export const createQuizQuestion = async (
  db: DatabaseExecutor,
  input: CreateQuizQuestionInput,
  now = new Date(),
): Promise<QuizQuestionContract> => {
  const parsed = QuizQuestion.parse({
    id: QuizQuestionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    quizId: QuizId.parse(input.quizId),
    position: input.position,
    questionType: input.questionType,
    prompt: input.prompt,
    points: input.points,
    choices: input.choices,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .insert(quizQuestion)
    .values({ ...parsed, answerKey: input.answerKey ?? null })
    .returning();

  if (!row) {
    throw new Error('Quiz question could not be created because the database returned no row.');
  }

  return QuizQuestion.parse(row);
};

export const listQuizQuestionsWithAnswerKeysForQuiz = async (
  db: Database,
  input: ListQuizQuestionsForQuizInput,
): Promise<AutoGradableQuizQuestion[]> => {
  const rows = await db
    .select()
    .from(quizQuestion)
    .where(and(eq(quizQuestion.tenantId, input.tenantId), eq(quizQuestion.quizId, input.quizId)))
    .orderBy(asc(quizQuestion.position));

  return rows.map((row) => ({
    ...QuizQuestion.parse(row),
    answerKey: row.answerKey ? QuizQuestionAnswerKey.parse(row.answerKey) : null,
  }));
};

export type ListQuizAttemptsForQuizInput = {
  tenantId: string;
  quizId: string;
  studentId?: string;
};

export const listQuizAttemptsForQuiz = async (
  db: Database,
  input: ListQuizAttemptsForQuizInput,
): Promise<QuizAttemptContract[]> => {
  const conditions = [
    eq(quizAttempt.tenantId, input.tenantId),
    eq(quizAttempt.quizId, input.quizId),
  ];

  if (input.studentId) {
    conditions.push(eq(quizAttempt.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(quizAttempt)
    .where(and(...conditions))
    .orderBy(asc(quizAttempt.attemptNumber));

  return rows.map((row) => QuizAttempt.parse(row));
};

export const saveQuizAttempt = async (
  db: Database,
  value: QuizAttemptContract,
): Promise<QuizAttemptContract> => {
  const parsed = QuizAttempt.parse(value);
  const [row] = await db.insert(quizAttempt).values(parsed).returning();

  if (!row) {
    throw new Error('Quiz attempt could not be saved because the database returned no row.');
  }

  return QuizAttempt.parse(row);
};

export type RecordQuizAttemptInput = {
  tenantId: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
};

export const recordQuizAttempt = async (
  db: Database,
  input: RecordQuizAttemptInput,
  now = new Date(),
): Promise<QuizAttemptContract> =>
  saveQuizAttempt(
    db,
    QuizAttempt.parse({
      id: QuizAttemptId.parse(ulid()),
      tenantId: input.tenantId,
      quizId: input.quizId,
      studentId: input.studentId,
      attemptNumber: input.attemptNumber,
      status: 'in_progress',
      startedAt: now,
      submittedAt: null,
      score: null,
      createdAt: now,
      updatedAt: now,
    }),
  );

export type SubmitQuizAttemptInput = {
  tenantId: string;
  attemptId: string;
  submittedAt?: Date;
  score?: number | null;
  status?: Extract<QuizAttemptContract['status'], 'submitted' | 'graded'>;
};

export const submitQuizAttempt = async (
  db: DatabaseExecutor,
  input: SubmitQuizAttemptInput,
): Promise<QuizAttemptContract> => {
  const submittedAt = input.submittedAt ?? new Date();
  const [row] = await db
    .update(quizAttempt)
    .set({
      status: input.status ?? 'submitted',
      submittedAt,
      score: input.score ?? null,
      updatedAt: submittedAt,
    })
    .where(
      and(
        eq(quizAttempt.tenantId, input.tenantId),
        eq(quizAttempt.id, input.attemptId),
        eq(quizAttempt.status, 'in_progress'),
      ),
    )
    .returning();

  if (!row) {
    throw new Error(
      'Quiz attempt could not be submitted because it was not found or is no longer in progress.',
    );
  }

  return QuizAttempt.parse(row);
};

export type UpdateQuizAttemptGradeInput = {
  tenantId: string;
  attemptId: string;
  score: number | null;
  status: Extract<QuizAttemptContract['status'], 'submitted' | 'graded'>;
};

export const updateQuizAttemptGrade = async (
  db: DatabaseExecutor,
  input: UpdateQuizAttemptGradeInput,
  now = new Date(),
): Promise<QuizAttemptContract | null> => {
  const [row] = await db
    .update(quizAttempt)
    .set({
      status: input.status,
      score: input.score,
      updatedAt: now,
    })
    .where(and(eq(quizAttempt.tenantId, input.tenantId), eq(quizAttempt.id, input.attemptId)))
    .returning();

  return row ? QuizAttempt.parse(row) : null;
};

export const saveQuizAttemptQuestionGrade = async (
  db: Database,
  value: QuizAttemptQuestionGradeContract,
): Promise<QuizAttemptQuestionGradeContract> => {
  const parsed = QuizAttemptQuestionGrade.parse(value);
  const [row] = await db
    .insert(quizAttemptQuestionGrade)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        quizAttemptQuestionGrade.tenantId,
        quizAttemptQuestionGrade.attemptId,
        quizAttemptQuestionGrade.questionId,
      ],
      set: {
        quizId: parsed.quizId,
        graderId: parsed.graderId,
        score: parsed.score,
        feedback: parsed.feedback,
        updatedAt: parsed.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Quiz attempt question grade could not be saved because the database returned no row.',
    );
  }

  return QuizAttemptQuestionGrade.parse(row);
};

export type RecordQuizAttemptQuestionGradeInput = {
  tenantId: string;
  quizId: string;
  attemptId: string;
  questionId: string;
  graderId: string;
  score: number;
  feedback: string | null;
};

export const recordQuizAttemptQuestionGrade = async (
  db: Database,
  input: RecordQuizAttemptQuestionGradeInput,
  now = new Date(),
): Promise<QuizAttemptQuestionGradeContract> =>
  saveQuizAttemptQuestionGrade(
    db,
    QuizAttemptQuestionGrade.parse({
      id: QuizAttemptQuestionGradeId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      quizId: QuizId.parse(input.quizId),
      attemptId: QuizAttemptId.parse(input.attemptId),
      questionId: QuizQuestionId.parse(input.questionId),
      graderId: UserId.parse(input.graderId),
      score: input.score,
      feedback: input.feedback,
      createdAt: now,
      updatedAt: now,
    }),
  );

export type ListQuizAttemptQuestionGradesForAttemptInput = {
  tenantId: string;
  attemptId: string;
};

export const listQuizAttemptQuestionGradesForAttempt = async (
  db: Database,
  input: ListQuizAttemptQuestionGradesForAttemptInput,
): Promise<QuizAttemptQuestionGradeContract[]> => {
  const rows = await db
    .select({ grade: quizAttemptQuestionGrade })
    .from(quizAttemptQuestionGrade)
    .innerJoin(
      quizQuestion,
      and(
        eq(quizQuestion.tenantId, quizAttemptQuestionGrade.tenantId),
        eq(quizQuestion.id, quizAttemptQuestionGrade.questionId),
      ),
    )
    .where(
      and(
        eq(quizAttemptQuestionGrade.tenantId, input.tenantId),
        eq(quizAttemptQuestionGrade.attemptId, input.attemptId),
      ),
    )
    .orderBy(asc(quizQuestion.position), asc(quizAttemptQuestionGrade.id));

  return rows.map((row) => QuizAttemptQuestionGrade.parse(row.grade));
};

export const saveQuizAttemptProbe = async (
  db: Database,
  value: QuizAttemptProbeContract,
): Promise<QuizAttemptProbeContract> => {
  const parsed = QuizAttemptProbe.parse(value);
  const [row] = await db.insert(quizAttemptProbe).values(parsed).returning();

  if (!row) {
    throw new Error('Quiz attempt probe could not be saved because the database returned no row.');
  }

  return QuizAttemptProbe.parse(row);
};

export type RecordQuizAttemptProbeInput = {
  tenantId: string;
  quizId: string;
  attemptId: string;
  learningObjectiveId: string;
  sourceQuestionBankQuestionId: string | null;
  position: number;
  difficultyTarget: number;
  prompt: string;
  renderModel: Record<string, unknown>;
  points: number;
  answerKey: QuizQuestionAnswerKey | null;
  aiGenerationLogId: string | null;
};

export const recordQuizAttemptProbe = async (
  db: Database,
  input: RecordQuizAttemptProbeInput,
  now = new Date(),
): Promise<QuizAttemptProbeContract> =>
  saveQuizAttemptProbe(
    db,
    QuizAttemptProbe.parse({
      id: QuizAttemptProbeId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      quizId: QuizId.parse(input.quizId),
      attemptId: QuizAttemptId.parse(input.attemptId),
      learningObjectiveId: LearningObjectiveId.parse(input.learningObjectiveId),
      sourceQuestionBankQuestionId:
        input.sourceQuestionBankQuestionId === null
          ? null
          : QuestionBankQuestionId.parse(input.sourceQuestionBankQuestionId),
      position: input.position,
      difficultyTarget: input.difficultyTarget,
      prompt: input.prompt,
      renderModel: input.renderModel,
      points: input.points,
      answerKey: input.answerKey,
      aiGenerationLogId: input.aiGenerationLogId,
      createdAt: now,
    }),
  );

export type ListQuizAttemptProbesForAttemptInput = {
  tenantId: string;
  attemptId: string;
};

export const listQuizAttemptProbesForAttempt = async (
  db: Database,
  input: ListQuizAttemptProbesForAttemptInput,
): Promise<QuizAttemptProbeContract[]> => {
  const rows = await db
    .select()
    .from(quizAttemptProbe)
    .where(
      and(
        eq(quizAttemptProbe.tenantId, input.tenantId),
        eq(quizAttemptProbe.attemptId, input.attemptId),
      ),
    )
    .orderBy(asc(quizAttemptProbe.position), asc(quizAttemptProbe.id));

  return rows.map((row) => QuizAttemptProbe.parse(row));
};

export const saveQuizAttemptProbeResponse = async (
  db: Database,
  value: QuizAttemptProbeResponseContract,
): Promise<QuizAttemptProbeResponseContract> => {
  const parsed = QuizAttemptProbeResponse.parse(value);
  const [row] = await db
    .insert(quizAttemptProbeResponse)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        quizAttemptProbeResponse.tenantId,
        quizAttemptProbeResponse.attemptId,
        quizAttemptProbeResponse.probeId,
      ],
      set: {
        quizId: parsed.quizId,
        answer: parsed.answer,
        updatedAt: parsed.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Quiz attempt probe response could not be saved because the database returned no row.',
    );
  }

  return QuizAttemptProbeResponse.parse(row);
};

export type RecordQuizAttemptProbeResponseInput = {
  tenantId: string;
  quizId: string;
  attemptId: string;
  probeId: string;
  answer: QuizAttemptResponseAnswer;
};

export const recordQuizAttemptProbeResponse = async (
  db: Database,
  input: RecordQuizAttemptProbeResponseInput,
  now = new Date(),
): Promise<QuizAttemptProbeResponseContract> =>
  saveQuizAttemptProbeResponse(
    db,
    QuizAttemptProbeResponse.parse({
      id: QuizAttemptProbeResponseId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      quizId: QuizId.parse(input.quizId),
      attemptId: QuizAttemptId.parse(input.attemptId),
      probeId: QuizAttemptProbeId.parse(input.probeId),
      answer: input.answer,
      createdAt: now,
      updatedAt: now,
    }),
  );

export const saveQuizAttemptResponse = async (
  db: Database,
  value: QuizAttemptResponseContract,
): Promise<QuizAttemptResponseContract> => {
  const parsed = QuizAttemptResponse.parse(value);
  const [row] = await db
    .insert(quizAttemptResponse)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        quizAttemptResponse.tenantId,
        quizAttemptResponse.attemptId,
        quizAttemptResponse.questionId,
      ],
      set: {
        quizId: parsed.quizId,
        answer: parsed.answer,
        updatedAt: parsed.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Quiz attempt response could not be saved because the database returned no row.',
    );
  }

  return QuizAttemptResponse.parse(row);
};

export type RecordQuizAttemptResponseInput = {
  tenantId: string;
  quizId: string;
  attemptId: string;
  questionId: string;
  answer: QuizAttemptResponseAnswer;
};

export const recordQuizAttemptResponse = async (
  db: Database,
  input: RecordQuizAttemptResponseInput,
  now = new Date(),
): Promise<QuizAttemptResponseContract> =>
  saveQuizAttemptResponse(
    db,
    QuizAttemptResponse.parse({
      id: QuizAttemptResponseId.parse(ulid()),
      tenantId: input.tenantId,
      quizId: input.quizId,
      attemptId: input.attemptId,
      questionId: input.questionId,
      answer: input.answer,
      createdAt: now,
      updatedAt: now,
    }),
  );

export type ListQuizAttemptResponsesForAttemptInput = {
  tenantId: string;
  attemptId: string;
};

export const listQuizAttemptResponsesForAttempt = async (
  db: Database,
  input: ListQuizAttemptResponsesForAttemptInput,
): Promise<QuizAttemptResponseContract[]> => {
  const rows = await db
    .select({ response: quizAttemptResponse })
    .from(quizAttemptResponse)
    .innerJoin(
      quizQuestion,
      and(
        eq(quizQuestion.tenantId, quizAttemptResponse.tenantId),
        eq(quizQuestion.id, quizAttemptResponse.questionId),
      ),
    )
    .where(
      and(
        eq(quizAttemptResponse.tenantId, input.tenantId),
        eq(quizAttemptResponse.attemptId, input.attemptId),
      ),
    )
    .orderBy(asc(quizQuestion.position), asc(quizAttemptResponse.id));

  return rows.map((row) => QuizAttemptResponse.parse(row.response));
};
