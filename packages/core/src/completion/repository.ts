import {
  CompletionProgress,
  type CompletionProgress as CompletionProgressContract,
  CompletionProgressId,
  CompletionRequirement,
  type CompletionRequirement as CompletionRequirementContract,
  CompletionRequirementId,
  type CompletionRequirementStatus,
  type CompletionRequirementType,
  type CompletionTargetType,
  CourseId,
  CourseModuleId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import { completionProgress, completionRequirement } from '../db/schema/completion.ts';

export type CreateCompletionRequirementInput = {
  tenantId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  description: string | null;
  requirementType: CompletionRequirementType;
  targetType: CompletionTargetType;
  targetId: string | null;
  minScorePercent: number | null;
  status: CompletionRequirementStatus;
  required: boolean;
  position: number;
};

export const createCompletionRequirement = async (
  db: Database,
  input: CreateCompletionRequirementInput,
  now = new Date(),
): Promise<CompletionRequirementContract> => {
  const parsed = CompletionRequirement.parse({
    id: CompletionRequirementId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
    title: input.title,
    description: input.description,
    requirementType: input.requirementType,
    targetType: input.targetType,
    targetId: input.targetId,
    minScorePercent: input.minScorePercent,
    status: input.status,
    required: input.required,
    position: input.position,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(completionRequirement).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Completion requirement could not be created because the database returned no row.',
    );
  }

  return CompletionRequirement.parse(row);
};

export type ListCompletionRequirementsForCourseInput = {
  tenantId: string;
  courseId: string;
  moduleId?: string;
  statuses: CompletionRequirementStatus[];
};

export const listCompletionRequirementsForCourse = async (
  db: Database,
  input: ListCompletionRequirementsForCourseInput,
): Promise<CompletionRequirementContract[]> => {
  const conditions = [
    eq(completionRequirement.tenantId, input.tenantId),
    eq(completionRequirement.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(completionRequirement.status, input.statuses));
  }

  if (input.moduleId !== undefined) {
    conditions.push(eq(completionRequirement.moduleId, input.moduleId));
  }

  const rows = await db
    .select()
    .from(completionRequirement)
    .where(and(...conditions))
    .orderBy(asc(completionRequirement.position), asc(completionRequirement.title));

  return rows.map((row) => CompletionRequirement.parse(row));
};

export type ListActiveViewResourceCompletionRequirementsInput = {
  tenantId: string;
  courseId: string;
  resourceId: string;
};

export const listActiveViewResourceCompletionRequirements = async (
  db: DatabaseExecutor,
  input: ListActiveViewResourceCompletionRequirementsInput,
): Promise<CompletionRequirementContract[]> => {
  const rows = await db
    .select()
    .from(completionRequirement)
    .where(
      and(
        eq(completionRequirement.tenantId, input.tenantId),
        eq(completionRequirement.courseId, input.courseId),
        eq(completionRequirement.requirementType, 'view_resource'),
        eq(completionRequirement.targetType, 'course_resource'),
        eq(completionRequirement.targetId, input.resourceId),
        eq(completionRequirement.status, 'active'),
      ),
    )
    .orderBy(asc(completionRequirement.position), asc(completionRequirement.title));

  return rows.map((row) => CompletionRequirement.parse(row));
};

export type ListActivePassQuizCompletionRequirementsInput = {
  tenantId: string;
  courseId: string;
  quizId: string;
};

export const listActivePassQuizCompletionRequirements = async (
  db: DatabaseExecutor,
  input: ListActivePassQuizCompletionRequirementsInput,
): Promise<CompletionRequirementContract[]> => {
  const rows = await db
    .select()
    .from(completionRequirement)
    .where(
      and(
        eq(completionRequirement.tenantId, input.tenantId),
        eq(completionRequirement.courseId, input.courseId),
        eq(completionRequirement.requirementType, 'pass_quiz'),
        eq(completionRequirement.targetType, 'quiz'),
        eq(completionRequirement.targetId, input.quizId),
        eq(completionRequirement.status, 'active'),
      ),
    )
    .orderBy(asc(completionRequirement.position), asc(completionRequirement.title));

  return rows.map((row) => CompletionRequirement.parse(row));
};

export type ListActiveSubmitAssignmentCompletionRequirementsInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
};

export const listActiveSubmitAssignmentCompletionRequirements = async (
  db: DatabaseExecutor,
  input: ListActiveSubmitAssignmentCompletionRequirementsInput,
): Promise<CompletionRequirementContract[]> => {
  const rows = await db
    .select()
    .from(completionRequirement)
    .where(
      and(
        eq(completionRequirement.tenantId, input.tenantId),
        eq(completionRequirement.courseId, input.courseId),
        eq(completionRequirement.requirementType, 'submit_assignment'),
        eq(completionRequirement.targetType, 'assignment'),
        eq(completionRequirement.targetId, input.assignmentId),
        eq(completionRequirement.status, 'active'),
      ),
    )
    .orderBy(asc(completionRequirement.position), asc(completionRequirement.title));

  return rows.map((row) => CompletionRequirement.parse(row));
};

export const getCompletionRequirementForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  requirementId: string,
): Promise<CompletionRequirementContract | null> => {
  const [row] = await db
    .select()
    .from(completionRequirement)
    .where(
      and(
        eq(completionRequirement.tenantId, tenantId),
        eq(completionRequirement.courseId, courseId),
        eq(completionRequirement.id, requirementId),
      ),
    )
    .limit(1);

  return row ? CompletionRequirement.parse(row) : null;
};

export type ListCompletionProgressForRequirementInput = {
  tenantId: string;
  requirementId: string;
  studentId?: string;
};

export const listCompletionProgressForRequirement = async (
  db: Database,
  input: ListCompletionProgressForRequirementInput,
): Promise<CompletionProgressContract[]> => {
  const conditions = [
    eq(completionProgress.tenantId, input.tenantId),
    eq(completionProgress.requirementId, input.requirementId),
  ];

  if (input.studentId) {
    conditions.push(eq(completionProgress.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(completionProgress)
    .where(and(...conditions))
    .orderBy(asc(completionProgress.studentId));

  return rows.map((row) => CompletionProgress.parse(row));
};

export type CompleteCompletionProgressInput = {
  tenantId: string;
  requirementId: string;
  studentId: string;
  completedAt: Date;
};

export const completeCompletionProgress = async (
  db: DatabaseExecutor,
  input: CompleteCompletionProgressInput,
  now = new Date(),
): Promise<CompletionProgressContract> => {
  const parsed = CompletionProgress.parse({
    id: CompletionProgressId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    requirementId: CompletionRequirementId.parse(input.requirementId),
    studentId: UserId.parse(input.studentId),
    status: 'completed',
    completedAt: input.completedAt,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(completionProgress)
    .values(parsed)
    .onConflictDoUpdate({
      target: [
        completionProgress.tenantId,
        completionProgress.requirementId,
        completionProgress.studentId,
      ],
      set: {
        status: 'completed',
        completedAt: input.completedAt,
        updatedAt: now,
      },
    })
    .returning();

  if (!row) {
    throw new Error(
      'Completion progress could not be completed because the database returned no row.',
    );
  }

  return CompletionProgress.parse(row);
};
