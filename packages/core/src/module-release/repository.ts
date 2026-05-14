import {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  type ModuleReleaseCombinator,
  ModuleReleaseOverride,
  type ModuleReleaseOverride as ModuleReleaseOverrideContract,
  type ModuleReleaseOverrideState,
  ModuleReleasePolicy,
  type ModuleReleasePolicy as ModuleReleasePolicyContract,
  ModuleReleaseRule,
  type ModuleReleaseRule as ModuleReleaseRuleContract,
  type ModuleReleaseRuleStatus,
  type ModuleReleaseTargetType,
  type ModuleReleaseRuleType,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import {
  courseModuleReleaseOverride,
  courseModuleReleasePolicy,
  courseModuleReleaseRule,
} from '../db/schema/module-release.ts';

type ReleaseRuleConfig = ModuleReleaseRuleContract['config'];

export type CreateReleaseRuleInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  targetType: ModuleReleaseTargetType;
  targetId: string | null;
  ruleType: ModuleReleaseRuleType;
  config: ReleaseRuleConfig;
  position: number;
  status: ModuleReleaseRuleStatus;
};

export const createReleaseRule = async (
  db: Database,
  input: CreateReleaseRuleInput,
  now = new Date(),
): Promise<ModuleReleaseRuleContract> => {
  const parsed = ModuleReleaseRule.parse({
    id: CourseModuleReleaseRuleId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    targetType: input.targetType,
    targetId: input.targetId,
    ruleType: input.ruleType,
    config: input.config,
    position: input.position,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(courseModuleReleaseRule).values(parsed).returning();
  if (!row) {
    throw new Error(
      'Module release rule could not be created because the database returned no row.',
    );
  }
  return ModuleReleaseRule.parse(row);
};

export type ListReleaseRulesForModuleInput = {
  tenantId: string;
  moduleId: string;
  targetType?: ModuleReleaseTargetType;
  targetId?: string | null;
};

export const listReleaseRulesForModule = async (
  db: Database,
  input: ListReleaseRulesForModuleInput,
): Promise<ModuleReleaseRuleContract[]> => {
  const conditions = [
    eq(courseModuleReleaseRule.tenantId, input.tenantId),
    eq(courseModuleReleaseRule.moduleId, input.moduleId),
  ];

  if (input.targetType !== undefined) {
    conditions.push(eq(courseModuleReleaseRule.targetType, input.targetType));
  }

  if (input.targetId !== undefined) {
    conditions.push(
      input.targetId === null
        ? isNull(courseModuleReleaseRule.targetId)
        : eq(courseModuleReleaseRule.targetId, input.targetId),
    );
  }

  const rows = await db
    .select()
    .from(courseModuleReleaseRule)
    .where(and(...conditions))
    .orderBy(asc(courseModuleReleaseRule.position), asc(courseModuleReleaseRule.id));
  return rows.map((row) => ModuleReleaseRule.parse(row));
};

export type ListReleaseRulesForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listReleaseRulesForCourse = async (
  db: Database,
  input: ListReleaseRulesForCourseInput,
): Promise<ModuleReleaseRuleContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseRule)
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.courseId, input.courseId),
      ),
    )
    .orderBy(asc(courseModuleReleaseRule.moduleId), asc(courseModuleReleaseRule.position));
  return rows.map((row) => ModuleReleaseRule.parse(row));
};

export type UpdateReleaseRuleInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  targetType: ModuleReleaseTargetType;
  targetId: string | null;
  ruleId: string;
  ruleType: ModuleReleaseRuleType;
  config: ReleaseRuleConfig;
  position: number;
  status: ModuleReleaseRuleStatus;
};

export const updateReleaseRule = async (
  db: Database,
  input: UpdateReleaseRuleInput,
  now = new Date(),
): Promise<ModuleReleaseRuleContract> => {
  const candidate = ModuleReleaseRule.parse({
    id: CourseModuleReleaseRuleId.parse(input.ruleId),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    targetType: input.targetType,
    targetId: input.targetId,
    ruleType: input.ruleType,
    config: input.config,
    position: input.position,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .update(courseModuleReleaseRule)
    .set({
      ruleType: candidate.ruleType,
      config: candidate.config,
      targetType: candidate.targetType,
      targetId: candidate.targetId,
      position: candidate.position,
      status: candidate.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.courseId, input.courseId),
        eq(courseModuleReleaseRule.moduleId, input.moduleId),
        eq(courseModuleReleaseRule.id, input.ruleId),
      ),
    )
    .returning();
  if (!row) {
    throw new Error(
      'Module release rule could not be updated because the database returned no row.',
    );
  }
  return ModuleReleaseRule.parse(row);
};

export type DeleteReleaseRuleInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  ruleId: string;
};

export const deleteReleaseRule = async (
  db: Database,
  input: DeleteReleaseRuleInput,
): Promise<boolean> => {
  const [row] = await db
    .delete(courseModuleReleaseRule)
    .where(
      and(
        eq(courseModuleReleaseRule.tenantId, input.tenantId),
        eq(courseModuleReleaseRule.courseId, input.courseId),
        eq(courseModuleReleaseRule.moduleId, input.moduleId),
        eq(courseModuleReleaseRule.id, input.ruleId),
      ),
    )
    .returning({ id: courseModuleReleaseRule.id });
  return row !== undefined;
};

export type UpsertReleasePolicyInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  combinator: ModuleReleaseCombinator;
};

export const upsertReleasePolicy = async (
  db: Database,
  input: UpsertReleasePolicyInput,
  now = new Date(),
): Promise<ModuleReleasePolicyContract> => {
  const candidate = ModuleReleasePolicy.parse({
    id: CourseModuleReleasePolicyId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    combinator: input.combinator,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(courseModuleReleasePolicy)
    .values(candidate)
    .onConflictDoUpdate({
      target: [courseModuleReleasePolicy.tenantId, courseModuleReleasePolicy.moduleId],
      set: { combinator: input.combinator, updatedAt: now },
    })
    .returning();
  if (!row) {
    throw new Error(
      'Module release policy could not be upserted because the database returned no row.',
    );
  }
  return ModuleReleasePolicy.parse(row);
};

export type GetReleasePolicyInput = {
  tenantId: string;
  moduleId: string;
};

export const getReleasePolicy = async (
  db: Database,
  input: GetReleasePolicyInput,
): Promise<ModuleReleasePolicyContract | null> => {
  const [row] = await db
    .select()
    .from(courseModuleReleasePolicy)
    .where(
      and(
        eq(courseModuleReleasePolicy.tenantId, input.tenantId),
        eq(courseModuleReleasePolicy.moduleId, input.moduleId),
      ),
    )
    .limit(1);
  return row ? ModuleReleasePolicy.parse(row) : null;
};

export type ListReleasePoliciesForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listReleasePoliciesForCourse = async (
  db: Database,
  input: ListReleasePoliciesForCourseInput,
): Promise<ModuleReleasePolicyContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleasePolicy)
    .where(
      and(
        eq(courseModuleReleasePolicy.tenantId, input.tenantId),
        eq(courseModuleReleasePolicy.courseId, input.courseId),
      ),
    );
  return rows.map((row) => ModuleReleasePolicy.parse(row));
};

export type UpsertReleaseOverrideInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  studentId: string;
  state: ModuleReleaseOverrideState;
  reason: string | null;
  grantedByUserId: string | null;
  expiresAt: Date | null;
};

export const upsertReleaseOverride = async (
  db: Database,
  input: UpsertReleaseOverrideInput,
  now = new Date(),
): Promise<ModuleReleaseOverrideContract> => {
  const candidate = ModuleReleaseOverride.parse({
    id: CourseModuleReleaseOverrideId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    moduleId: CourseModuleId.parse(input.moduleId),
    studentId: UserId.parse(input.studentId),
    state: input.state,
    reason: input.reason,
    grantedByUserId: input.grantedByUserId === null ? null : UserId.parse(input.grantedByUserId),
    grantedAt: now,
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .insert(courseModuleReleaseOverride)
    .values(candidate)
    .onConflictDoUpdate({
      target: [
        courseModuleReleaseOverride.tenantId,
        courseModuleReleaseOverride.moduleId,
        courseModuleReleaseOverride.studentId,
      ],
      set: {
        state: input.state,
        reason: input.reason,
        grantedByUserId: input.grantedByUserId,
        grantedAt: now,
        expiresAt: input.expiresAt,
        updatedAt: now,
      },
    })
    .returning();
  if (!row) {
    throw new Error(
      'Module release override could not be upserted because the database returned no row.',
    );
  }
  return ModuleReleaseOverride.parse(row);
};

export type ListReleaseOverridesForModuleInput = {
  tenantId: string;
  moduleId: string;
};

export const listReleaseOverridesForModule = async (
  db: Database,
  input: ListReleaseOverridesForModuleInput,
): Promise<ModuleReleaseOverrideContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.moduleId, input.moduleId),
      ),
    )
    .orderBy(asc(courseModuleReleaseOverride.studentId));
  return rows.map((row) => ModuleReleaseOverride.parse(row));
};

export type ListReleaseOverridesForStudentInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
};

export const listReleaseOverridesForStudent = async (
  db: Database,
  input: ListReleaseOverridesForStudentInput,
): Promise<ModuleReleaseOverrideContract[]> => {
  const rows = await db
    .select()
    .from(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.courseId, input.courseId),
        eq(courseModuleReleaseOverride.studentId, input.studentId),
      ),
    )
    .orderBy(asc(courseModuleReleaseOverride.moduleId));
  return rows.map((row) => ModuleReleaseOverride.parse(row));
};

export type GetReleaseOverrideForStudentInput = {
  tenantId: string;
  moduleId: string;
  studentId: string;
};

export const getReleaseOverrideForStudent = async (
  db: Database,
  input: GetReleaseOverrideForStudentInput,
): Promise<ModuleReleaseOverrideContract | null> => {
  const [row] = await db
    .select()
    .from(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.moduleId, input.moduleId),
        eq(courseModuleReleaseOverride.studentId, input.studentId),
      ),
    )
    .limit(1);
  return row ? ModuleReleaseOverride.parse(row) : null;
};

export type RemoveReleaseOverrideInput = {
  tenantId: string;
  courseId: string;
  moduleId: string;
  studentId: string;
};

export const removeReleaseOverride = async (
  db: Database,
  input: RemoveReleaseOverrideInput,
): Promise<void> => {
  await db
    .delete(courseModuleReleaseOverride)
    .where(
      and(
        eq(courseModuleReleaseOverride.tenantId, input.tenantId),
        eq(courseModuleReleaseOverride.courseId, input.courseId),
        eq(courseModuleReleaseOverride.moduleId, input.moduleId),
        eq(courseModuleReleaseOverride.studentId, input.studentId),
      ),
    );
};
