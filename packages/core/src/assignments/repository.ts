import {
  Assignment,
  type AssignmentAllowedFileExtension,
  type AssignmentAiSettings,
  type Assignment as AssignmentContract,
  AssignmentId,
  AssignmentOverride,
  type AssignmentOverride as AssignmentOverrideContract,
  AssignmentOverrideId,
  type AssignmentOverrideStatus,
  type AssignmentOverrideTargetType,
  type AssignmentStatus,
  CourseId,
  CourseGroupSetId,
  CourseModuleId,
  CourseUnitId,
  RubricId,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { assignment, assignmentOverride } from '../db/schema/assignment.ts';

export const saveAssignment = async (
  db: Database,
  value: AssignmentContract,
): Promise<AssignmentContract> => {
  const parsed = Assignment.parse(value);
  const [row] = await db.insert(assignment).values(parsed).returning();

  if (!row) {
    throw new Error('Assignment could not be saved because the database returned no row.');
  }

  return Assignment.parse(row);
};

export type CreateAssignmentInput = {
  tenantId: string;
  courseId: string;
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  instructions: string;
  status: AssignmentStatus;
  dueAt: Date | null;
  allowResubmission: boolean;
  activeRubricId: string | null;
  aiSettings: AssignmentAiSettings;
  extraCredit?: boolean;
  anonymousGradingEnabled?: boolean;
  groupSubmissionEnabled?: boolean;
  groupSetId?: string | null;
  allowedFileExtensions?: AssignmentAllowedFileExtension[];
  maxFileSizeBytes?: number | null;
};

export const createAssignment = async (
  db: Database,
  input: CreateAssignmentInput,
  now = new Date(),
): Promise<AssignmentContract> => {
  const parsed = Assignment.parse({
    id: AssignmentId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
    unitId: input.unitId === null ? null : CourseUnitId.parse(input.unitId),
    position: input.position,
    title: input.title,
    instructions: input.instructions,
    status: input.status,
    dueAt: input.dueAt,
    allowResubmission: input.allowResubmission,
    activeRubricId: input.activeRubricId === null ? null : RubricId.parse(input.activeRubricId),
    aiSettings: input.aiSettings,
    extraCredit: input.extraCredit ?? false,
    anonymousGradingEnabled: input.anonymousGradingEnabled ?? false,
    groupSubmissionEnabled: input.groupSubmissionEnabled ?? false,
    groupSetId:
      input.groupSetId === null || input.groupSetId === undefined
        ? null
        : CourseGroupSetId.parse(input.groupSetId),
    allowedFileExtensions: input.allowedFileExtensions ?? [],
    maxFileSizeBytes: input.maxFileSizeBytes ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(assignment).values(parsed).returning();

  if (!row) {
    throw new Error('Assignment could not be created because the database returned no row.');
  }

  return Assignment.parse(row);
};

export const getAssignmentById = async (
  db: Database,
  tenantId: string,
  assignmentId: string,
): Promise<AssignmentContract | null> => {
  const [row] = await db
    .select()
    .from(assignment)
    .where(and(eq(assignment.tenantId, tenantId), eq(assignment.id, assignmentId)))
    .limit(1);

  if (!row || row.tenantId !== tenantId) {
    return null;
  }

  return Assignment.parse(row);
};

export type ListAssignmentsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: AssignmentStatus[];
  moduleId?: string;
  unitId?: string;
};

export const listAssignmentsForCourse = async (
  db: Database,
  input: ListAssignmentsForCourseInput,
): Promise<AssignmentContract[]> => {
  const conditions = [
    eq(assignment.tenantId, input.tenantId),
    eq(assignment.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(assignment.status, input.statuses));
  }

  if (input.moduleId) {
    conditions.push(eq(assignment.moduleId, input.moduleId));
  }

  if (input.unitId) {
    conditions.push(eq(assignment.unitId, input.unitId));
  }

  const orderExpressions =
    input.moduleId || input.unitId
      ? [sql`${assignment.position} asc nulls last`, asc(assignment.title), asc(assignment.id)]
      : [sql`${assignment.dueAt} asc nulls last`, asc(assignment.title), asc(assignment.id)];

  const rows = await db
    .select()
    .from(assignment)
    .where(and(...conditions))
    .orderBy(...orderExpressions);

  return rows.map((row) => Assignment.parse(row));
};

export type UpdateAssignmentInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  instructions: string;
  status: AssignmentStatus;
  dueAt: Date | null;
  allowResubmission: boolean;
  activeRubricId: string | null;
  aiSettings: AssignmentAiSettings;
  extraCredit?: boolean;
  anonymousGradingEnabled?: boolean;
  groupSubmissionEnabled?: boolean;
  groupSetId?: string | null;
  allowedFileExtensions?: AssignmentAllowedFileExtension[];
  maxFileSizeBytes?: number | null;
};

export const updateAssignment = async (
  db: Database,
  input: UpdateAssignmentInput,
  now = new Date(),
): Promise<AssignmentContract | null> => {
  const [row] = await db
    .update(assignment)
    .set({
      moduleId: input.moduleId === null ? null : CourseModuleId.parse(input.moduleId),
      unitId: input.unitId === null ? null : CourseUnitId.parse(input.unitId),
      position: input.position,
      title: input.title,
      instructions: input.instructions,
      status: input.status,
      dueAt: input.dueAt,
      allowResubmission: input.allowResubmission,
      activeRubricId: input.activeRubricId === null ? null : RubricId.parse(input.activeRubricId),
      extraCredit: input.extraCredit ?? false,
      anonymousGradingEnabled: input.anonymousGradingEnabled ?? false,
      groupSubmissionEnabled: input.groupSubmissionEnabled ?? false,
      groupSetId:
        input.groupSetId === null || input.groupSetId === undefined
          ? null
          : CourseGroupSetId.parse(input.groupSetId),
      allowedFileExtensions: input.allowedFileExtensions ?? [],
      maxFileSizeBytes: input.maxFileSizeBytes ?? null,
      aiSettings: input.aiSettings,
      updatedAt: now,
    })
    .where(
      and(
        eq(assignment.tenantId, input.tenantId),
        eq(assignment.courseId, input.courseId),
        eq(assignment.id, input.assignmentId),
      ),
    )
    .returning();

  return row ? Assignment.parse(row) : null;
};

export type DeleteAssignmentInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
};

export const deleteAssignment = async (
  db: Database,
  input: DeleteAssignmentInput,
): Promise<boolean> => {
  const result = await db
    .delete(assignment)
    .where(
      and(
        eq(assignment.tenantId, input.tenantId),
        eq(assignment.courseId, input.courseId),
        eq(assignment.id, input.assignmentId),
      ),
    )
    .returning({ id: assignment.id });

  return result.length > 0;
};

export type ListAssignmentOverridesForAssignmentInput = {
  tenantId: string;
  assignmentId: string;
  statuses: AssignmentOverrideStatus[];
};

export const listAssignmentOverridesForAssignment = async (
  db: Database,
  input: ListAssignmentOverridesForAssignmentInput,
): Promise<AssignmentOverrideContract[]> => {
  const rows = await db
    .select()
    .from(assignmentOverride)
    .where(
      and(
        eq(assignmentOverride.tenantId, input.tenantId),
        eq(assignmentOverride.assignmentId, input.assignmentId),
        inArray(assignmentOverride.status, input.statuses),
      ),
    )
    .orderBy(asc(assignmentOverride.targetType), asc(assignmentOverride.targetId));

  return rows.map((row) => AssignmentOverride.parse(row));
};

export type CreateAssignmentOverrideInput = {
  tenantId: string;
  assignmentId: string;
  targetType: AssignmentOverrideTargetType;
  targetId: string;
  opensAt: Date | null;
  dueAt: Date | null;
  closesAt: Date | null;
  status: AssignmentOverrideStatus;
};

export const createAssignmentOverride = async (
  db: Database,
  input: CreateAssignmentOverrideInput,
  now = new Date(),
): Promise<AssignmentOverrideContract> => {
  const [row] = await db
    .insert(assignmentOverride)
    .values({
      id: AssignmentOverrideId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      assignmentId: AssignmentId.parse(input.assignmentId),
      targetType: input.targetType,
      targetId: input.targetId,
      opensAt: input.opensAt,
      dueAt: input.dueAt,
      closesAt: input.closesAt,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) {
    throw new Error(
      'Assignment override could not be created because the database returned no row.',
    );
  }

  return AssignmentOverride.parse(row);
};

export const getAssignmentOverrideById = async (
  db: Database,
  tenantId: string,
  overrideId: string,
): Promise<AssignmentOverrideContract | null> => {
  const [row] = await db
    .select()
    .from(assignmentOverride)
    .where(and(eq(assignmentOverride.tenantId, tenantId), eq(assignmentOverride.id, overrideId)))
    .limit(1);

  return row ? AssignmentOverride.parse(row) : null;
};

export type UpdateAssignmentOverrideInput = {
  tenantId: string;
  overrideId: string;
  opensAt: Date | null;
  dueAt: Date | null;
  closesAt: Date | null;
  status: AssignmentOverrideStatus;
};

export type DeleteAssignmentOverrideInput = {
  tenantId: string;
  overrideId: string;
};

export const deleteAssignmentOverride = async (
  db: Database,
  input: DeleteAssignmentOverrideInput,
): Promise<boolean> => {
  const result = await db
    .delete(assignmentOverride)
    .where(
      and(
        eq(assignmentOverride.tenantId, input.tenantId),
        eq(assignmentOverride.id, input.overrideId),
      ),
    )
    .returning({ id: assignmentOverride.id });

  return result.length > 0;
};

export const updateAssignmentOverride = async (
  db: Database,
  input: UpdateAssignmentOverrideInput,
  now = new Date(),
): Promise<AssignmentOverrideContract> => {
  const [row] = await db
    .update(assignmentOverride)
    .set({
      opensAt: input.opensAt,
      dueAt: input.dueAt,
      closesAt: input.closesAt,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(assignmentOverride.tenantId, input.tenantId),
        eq(assignmentOverride.id, input.overrideId),
      ),
    )
    .returning();

  if (!row) {
    throw new Error(
      'Assignment override could not be updated because it was not found in this tenant.',
    );
  }

  return AssignmentOverride.parse(row);
};
