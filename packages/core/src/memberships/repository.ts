import {
  CourseId,
  CourseMembership,
  type CourseMembership as CourseMembershipContract,
  CourseMembershipId,
  CourseMembershipStatus,
  type CourseMembershipStatus as CourseMembershipStatusContract,
  CourseRole,
  type CourseRole as CourseRoleContract,
  MembershipId,
  type MessageableUser as MessageableUserContract,
  TenantId,
  TenantMembership,
  type TenantMembership as TenantMembershipContract,
  TenantRole,
  type TenantRole as TenantRoleContract,
  UserId,
} from '@openlms/contracts';
import { and, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { user } from '../db/schema/auth.ts';
import {
  type CourseMembershipRow,
  type TenantMembershipRow,
  courseMembership,
  tenantMembership,
} from '../db/schema/membership.ts';

export type CreateTenantMembershipInput = {
  tenantId: string;
  userId: string;
  role: TenantRoleContract;
};

export type CreateCourseMembershipInput = {
  tenantId: string;
  courseId: string;
  userId: string;
  role: CourseRoleContract;
  status?: CourseMembershipStatusContract;
};

const toTenantMembership = (row: TenantMembershipRow): TenantMembershipContract =>
  TenantMembership.parse({
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

const toCourseMembership = (row: CourseMembershipRow): CourseMembershipContract =>
  CourseMembership.parse({
    id: row.id,
    tenantId: row.tenantId,
    courseId: row.courseId,
    userId: row.userId,
    role: row.role,
    status: row.status,
    invitedAt: row.invitedAt,
    acceptedAt: row.acceptedAt,
    droppedAt: row.droppedAt,
    withdrawnAt: row.withdrawnAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

export const createTenantMembership = async (
  db: Database,
  input: CreateTenantMembershipInput,
): Promise<TenantMembershipContract> => {
  const [row] = await db
    .insert(tenantMembership)
    .values({
      id: MembershipId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      userId: UserId.parse(input.userId),
      role: TenantRole.parse(input.role),
    })
    .returning();

  if (!row) {
    throw new Error('Tenant membership could not be created because the database returned no row.');
  }

  return toTenantMembership(row);
};

export const listUserTenantMemberships = async (
  db: Database,
  userId: string,
): Promise<TenantMembershipContract[]> => {
  const rows = await db
    .select()
    .from(tenantMembership)
    .where(eq(tenantMembership.userId, UserId.parse(userId)));

  return rows.map(toTenantMembership);
};

export const listTenantMembers = async (
  db: Database,
  tenantId: string,
): Promise<TenantMembershipContract[]> => {
  const rows = await db
    .select()
    .from(tenantMembership)
    .where(eq(tenantMembership.tenantId, TenantId.parse(tenantId)));

  return rows.map(toTenantMembership);
};

export type GetTenantMembershipByIdInput = {
  tenantId: string;
  membershipId: string;
};

export const getTenantMembershipById = async (
  db: Database,
  input: GetTenantMembershipByIdInput,
): Promise<TenantMembershipContract | null> => {
  const [row] = await db
    .select()
    .from(tenantMembership)
    .where(
      and(
        eq(tenantMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(tenantMembership.id, MembershipId.parse(input.membershipId)),
      ),
    )
    .limit(1);

  return row ? toTenantMembership(row) : null;
};

export type UpdateTenantMembershipInput = {
  tenantId: string;
  membershipId: string;
  role: TenantRoleContract;
};

// Updates the role on a tenant membership. The unique key on the table is
// (tenantId, userId, role); attempting to set the role to one the user
// already has would fail with a 23505. Callers should map that to a 409.
export const updateTenantMembership = async (
  db: Database,
  input: UpdateTenantMembershipInput,
  now = new Date(),
): Promise<TenantMembershipContract | null> => {
  const [row] = await db
    .update(tenantMembership)
    .set({ role: input.role, updatedAt: now })
    .where(
      and(
        eq(tenantMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(tenantMembership.id, MembershipId.parse(input.membershipId)),
      ),
    )
    .returning();

  return row ? toTenantMembership(row) : null;
};

export const userHasTenantRole = async (
  db: Database,
  input: CreateTenantMembershipInput,
): Promise<boolean> => {
  const [row] = await db
    .select({ id: tenantMembership.id })
    .from(tenantMembership)
    .where(
      and(
        eq(tenantMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(tenantMembership.userId, UserId.parse(input.userId)),
        eq(tenantMembership.role, TenantRole.parse(input.role)),
      ),
    )
    .limit(1);

  return Boolean(row);
};

export const createCourseMembership = async (
  db: Database,
  input: CreateCourseMembershipInput,
): Promise<CourseMembershipContract> => {
  const now = new Date();
  const status = CourseMembershipStatus.parse(input.status ?? 'active');
  const [row] = await db
    .insert(courseMembership)
    .values({
      id: CourseMembershipId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      userId: UserId.parse(input.userId),
      role: CourseRole.parse(input.role),
      status,
      invitedAt: status === 'invited' ? now : null,
      acceptedAt: status === 'active' ? now : null,
      droppedAt: status === 'dropped' ? now : null,
      withdrawnAt: status === 'withdrawn' ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) {
    throw new Error('Course membership could not be created because the database returned no row.');
  }

  return toCourseMembership(row);
};

export const listUserCourseMemberships = async (
  db: Database,
  userId: string,
): Promise<CourseMembershipContract[]> => {
  const rows = await db
    .select()
    .from(courseMembership)
    .where(eq(courseMembership.userId, UserId.parse(userId)));

  return rows.map(toCourseMembership);
};

export type ListCourseMembershipsInput = {
  tenantId: string;
  courseId: string;
  role?: CourseRoleContract;
  status?: CourseMembershipStatusContract;
};

export const listCourseMemberships = async (
  db: Database,
  input: ListCourseMembershipsInput,
): Promise<CourseMembershipContract[]> => {
  const conditions = [
    eq(courseMembership.tenantId, TenantId.parse(input.tenantId)),
    eq(courseMembership.courseId, CourseId.parse(input.courseId)),
  ];

  if (input.role) {
    conditions.push(eq(courseMembership.role, input.role));
  }
  if (input.status) {
    conditions.push(eq(courseMembership.status, input.status));
  }

  const rows = await db
    .select()
    .from(courseMembership)
    .where(and(...conditions));

  return rows.map(toCourseMembership);
};

export const listMessageableUsersInCourse = async (
  db: Database,
  input: { tenantId: string; courseId: string },
): Promise<MessageableUserContract[]> => {
  const rows = await db
    .select({
      userId: courseMembership.userId,
      displayName: user.name,
      role: courseMembership.role,
    })
    .from(courseMembership)
    .innerJoin(user, eq(courseMembership.userId, user.id))
    .where(
      and(
        eq(courseMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(courseMembership.courseId, CourseId.parse(input.courseId)),
        eq(courseMembership.status, 'active'),
      ),
    );

  return rows.map((row) => ({
    userId: UserId.parse(row.userId),
    displayName: row.displayName,
    role: CourseRole.parse(row.role),
  }));
};

export type UpdateCourseMembershipInput = {
  tenantId: string;
  courseId: string;
  courseMembershipId: string;
  role?: CourseRoleContract;
  status?: CourseMembershipStatusContract;
};

export const updateCourseMembership = async (
  db: Database,
  input: UpdateCourseMembershipInput,
  now = new Date(),
): Promise<CourseMembershipContract | null> => {
  const status = input.status ? CourseMembershipStatus.parse(input.status) : undefined;
  const [row] = await db
    .update(courseMembership)
    .set({
      ...(input.role ? { role: CourseRole.parse(input.role) } : {}),
      ...(status ? { status } : {}),
      ...(status === 'active' ? { acceptedAt: now } : {}),
      ...(status === 'invited' ? { invitedAt: now } : {}),
      ...(status === 'dropped' ? { droppedAt: now } : {}),
      ...(status === 'withdrawn' ? { withdrawnAt: now } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(courseMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(courseMembership.courseId, CourseId.parse(input.courseId)),
        eq(courseMembership.id, input.courseMembershipId),
      ),
    )
    .returning();

  return row ? toCourseMembership(row) : null;
};

export type CountCourseMembershipsByStatusInput = {
  tenantId: string;
  courseId: string;
  role: CourseRoleContract;
  status: CourseMembershipStatusContract;
};

export const countCourseMembershipsByStatus = async (
  db: Database,
  input: CountCourseMembershipsByStatusInput,
): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courseMembership)
    .where(
      and(
        eq(courseMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(courseMembership.courseId, CourseId.parse(input.courseId)),
        eq(courseMembership.role, CourseRole.parse(input.role)),
        eq(courseMembership.status, CourseMembershipStatus.parse(input.status)),
      ),
    )
    .limit(1);

  return row?.count ?? 0;
};

export type DeleteCourseMembershipInput = {
  tenantId: string;
  courseId: string;
  courseMembershipId: string;
};

export const deleteCourseMembership = async (
  db: Database,
  input: DeleteCourseMembershipInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseMembership)
    .where(
      and(
        eq(courseMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(courseMembership.courseId, CourseId.parse(input.courseId)),
        eq(courseMembership.id, input.courseMembershipId),
      ),
    )
    .returning({ id: courseMembership.id });

  return result.length > 0;
};

export const userHasCourseRole = async (
  db: Database,
  input: CreateCourseMembershipInput,
): Promise<boolean> => {
  const [row] = await db
    .select({ id: courseMembership.id })
    .from(courseMembership)
    .where(
      and(
        eq(courseMembership.tenantId, TenantId.parse(input.tenantId)),
        eq(courseMembership.courseId, CourseId.parse(input.courseId)),
        eq(courseMembership.userId, UserId.parse(input.userId)),
        eq(courseMembership.role, CourseRole.parse(input.role)),
      ),
    )
    .limit(1);

  return Boolean(row);
};
