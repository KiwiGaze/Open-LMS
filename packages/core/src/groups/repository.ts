import {
  CourseGroup,
  type CourseGroup as CourseGroupContract,
  CourseGroupId,
  CourseGroupMember,
  type CourseGroupMember as CourseGroupMemberContract,
  CourseGroupMemberId,
  type CourseGroupMemberRole,
  CourseGroupSet,
  type CourseGroupSet as CourseGroupSetContract,
  CourseGroupSetId,
  type CourseGroupSetStatus,
  type CourseGroupStatus,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { courseGroup, courseGroupMember, courseGroupSet } from '../db/schema/groups.ts';

export type CreateCourseGroupSetInput = {
  tenantId: string;
  courseId: string;
  name: string;
  selfSignupEnabled: boolean;
  status: CourseGroupSetStatus;
  position: number;
};

export const createCourseGroupSet = async (
  db: Database,
  input: CreateCourseGroupSetInput,
  now = new Date(),
): Promise<CourseGroupSetContract> => {
  const parsed = CourseGroupSet.parse({
    id: CourseGroupSetId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    name: input.name,
    selfSignupEnabled: input.selfSignupEnabled,
    status: input.status,
    position: input.position,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseGroupSet).values(parsed).returning();

  if (!row) {
    throw new Error('Course group set could not be created because the database returned no row.');
  }

  return CourseGroupSet.parse(row);
};

export type CreateCourseGroupInput = {
  tenantId: string;
  courseId: string;
  groupSetId: string;
  name: string;
  description: string | null;
  status: CourseGroupStatus;
  position: number;
};

export const createCourseGroup = async (
  db: Database,
  input: CreateCourseGroupInput,
  now = new Date(),
): Promise<CourseGroupContract> => {
  const parsed = CourseGroup.parse({
    id: CourseGroupId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    groupSetId: CourseGroupSetId.parse(input.groupSetId),
    name: input.name,
    description: input.description,
    status: input.status,
    position: input.position,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseGroup).values(parsed).returning();

  if (!row) {
    throw new Error('Course group could not be created because the database returned no row.');
  }

  return CourseGroup.parse(row);
};

export type CreateCourseGroupMemberInput = {
  tenantId: string;
  groupId: string;
  userId: string;
  role: CourseGroupMemberRole;
};

export const createCourseGroupMember = async (
  db: Database,
  input: CreateCourseGroupMemberInput,
  now = new Date(),
): Promise<CourseGroupMemberContract> => {
  const parsed = CourseGroupMember.parse({
    id: CourseGroupMemberId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    groupId: CourseGroupId.parse(input.groupId),
    userId: UserId.parse(input.userId),
    role: input.role,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseGroupMember).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Course group member could not be created because the database returned no row.',
    );
  }

  return CourseGroupMember.parse(row);
};

export type ListCourseGroupSetsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseGroupSetStatus[];
};

export const listCourseGroupSetsForCourse = async (
  db: Database,
  input: ListCourseGroupSetsForCourseInput,
): Promise<CourseGroupSetContract[]> => {
  const conditions = [
    eq(courseGroupSet.tenantId, input.tenantId),
    eq(courseGroupSet.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(courseGroupSet.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(courseGroupSet)
    .where(and(...conditions))
    .orderBy(asc(courseGroupSet.position), asc(courseGroupSet.name));

  return rows.map((row) => CourseGroupSet.parse(row));
};

export const getCourseGroupSetById = async (
  db: Database,
  tenantId: string,
  groupSetId: string,
): Promise<CourseGroupSetContract | null> => {
  const [row] = await db
    .select()
    .from(courseGroupSet)
    .where(and(eq(courseGroupSet.tenantId, tenantId), eq(courseGroupSet.id, groupSetId)))
    .limit(1);

  return row ? CourseGroupSet.parse(row) : null;
};

export type ListCourseGroupsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseGroupStatus[];
  memberUserId?: string;
};

export const listCourseGroupsForCourse = async (
  db: Database,
  input: ListCourseGroupsForCourseInput,
): Promise<CourseGroupContract[]> => {
  const conditions = [
    eq(courseGroup.tenantId, input.tenantId),
    eq(courseGroup.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(courseGroup.status, input.statuses));
  }

  if (input.memberUserId) {
    const memberships = await listCourseGroupMembershipsForUser(db, {
      tenantId: input.tenantId,
      userId: input.memberUserId,
    });
    const groupIds = memberships.map((membership) => membership.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    conditions.push(inArray(courseGroup.id, groupIds));
  }

  const rows = await db
    .select()
    .from(courseGroup)
    .where(and(...conditions))
    .orderBy(asc(courseGroup.position), asc(courseGroup.name));

  return rows.map((row) => CourseGroup.parse(row));
};

export const getCourseGroupForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  groupId: string,
): Promise<CourseGroupContract | null> => {
  const [row] = await db
    .select()
    .from(courseGroup)
    .where(
      and(
        eq(courseGroup.tenantId, tenantId),
        eq(courseGroup.courseId, courseId),
        eq(courseGroup.id, groupId),
      ),
    )
    .limit(1);

  return row ? CourseGroup.parse(row) : null;
};

export type ListCourseGroupMembersInput = {
  tenantId: string;
  groupId: string;
  userId?: string;
};

export const listCourseGroupMembers = async (
  db: Database,
  input: ListCourseGroupMembersInput,
): Promise<CourseGroupMemberContract[]> => {
  const conditions = [
    eq(courseGroupMember.tenantId, input.tenantId),
    eq(courseGroupMember.groupId, input.groupId),
  ];

  if (input.userId) {
    conditions.push(eq(courseGroupMember.userId, input.userId));
  }

  const rows = await db
    .select()
    .from(courseGroupMember)
    .where(and(...conditions))
    .orderBy(asc(courseGroupMember.userId));

  return rows.map((row) => CourseGroupMember.parse(row));
};

export type ListCourseGroupMembershipsForUserInput = {
  tenantId: string;
  userId: string;
};

export const listCourseGroupMembershipsForUser = async (
  db: Database,
  input: ListCourseGroupMembershipsForUserInput,
): Promise<CourseGroupMemberContract[]> => {
  const rows = await db
    .select()
    .from(courseGroupMember)
    .where(
      and(
        eq(courseGroupMember.tenantId, input.tenantId),
        eq(courseGroupMember.userId, input.userId),
      ),
    )
    .orderBy(asc(courseGroupMember.groupId));

  return rows.map((row) => CourseGroupMember.parse(row));
};

export type DeleteCourseGroupMembershipForUserInput = {
  tenantId: string;
  groupId: string;
  userId: string;
};

// Removes a single user's membership in a group. Idempotent — succeeds with no
// error when the user is not a member.
export const deleteCourseGroupMembershipForUser = async (
  db: Database,
  input: DeleteCourseGroupMembershipForUserInput,
): Promise<void> => {
  await db
    .delete(courseGroupMember)
    .where(
      and(
        eq(courseGroupMember.tenantId, input.tenantId),
        eq(courseGroupMember.groupId, input.groupId),
        eq(courseGroupMember.userId, input.userId),
      ),
    );
};
