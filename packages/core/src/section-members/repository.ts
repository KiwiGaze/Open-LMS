import {
  CourseId,
  CourseSectionId,
  CourseSectionInstructor,
  type CourseSectionInstructor as CourseSectionInstructorContract,
  CourseSectionInstructorId,
  CourseSectionMember,
  type CourseSectionMember as CourseSectionMemberContract,
  CourseSectionMemberId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { courseSectionInstructor, courseSectionMember } from '../db/schema/section-member.ts';

export type AssignStudentToSectionInput = {
  tenantId: string;
  courseId: string;
  sectionId: string;
  studentId: string;
};

export const assignStudentToSection = async (
  db: Database,
  input: AssignStudentToSectionInput,
  now = new Date(),
): Promise<CourseSectionMemberContract> => {
  const parsed = CourseSectionMember.parse({
    id: CourseSectionMemberId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    sectionId: CourseSectionId.parse(input.sectionId),
    studentId: UserId.parse(input.studentId),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseSectionMember).values(parsed).returning();
  if (!row) {
    throw new Error(
      'Course section member could not be created because the database returned no row.',
    );
  }
  return CourseSectionMember.parse(row);
};

export type ListSectionMembersForSectionInput = {
  tenantId: string;
  sectionId: string;
};

export const listSectionMembersForSection = async (
  db: Database,
  input: ListSectionMembersForSectionInput,
): Promise<CourseSectionMemberContract[]> => {
  const rows = await db
    .select()
    .from(courseSectionMember)
    .where(
      and(
        eq(courseSectionMember.tenantId, input.tenantId),
        eq(courseSectionMember.sectionId, input.sectionId),
      ),
    )
    .orderBy(asc(courseSectionMember.studentId));
  return rows.map((row) => CourseSectionMember.parse(row));
};

export type ListSectionMembershipsForStudentInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
};

export const listSectionMembershipsForStudent = async (
  db: Database,
  input: ListSectionMembershipsForStudentInput,
): Promise<CourseSectionMemberContract[]> => {
  const rows = await db
    .select()
    .from(courseSectionMember)
    .where(
      and(
        eq(courseSectionMember.tenantId, input.tenantId),
        eq(courseSectionMember.courseId, input.courseId),
        eq(courseSectionMember.studentId, input.studentId),
      ),
    )
    .orderBy(asc(courseSectionMember.sectionId));
  return rows.map((row) => CourseSectionMember.parse(row));
};

export type RemoveStudentFromSectionInput = {
  tenantId: string;
  sectionId: string;
  studentId: string;
};

export const removeStudentFromSection = async (
  db: Database,
  input: RemoveStudentFromSectionInput,
): Promise<void> => {
  await db
    .delete(courseSectionMember)
    .where(
      and(
        eq(courseSectionMember.tenantId, input.tenantId),
        eq(courseSectionMember.sectionId, input.sectionId),
        eq(courseSectionMember.studentId, input.studentId),
      ),
    );
};

export type AssignInstructorToSectionInput = {
  tenantId: string;
  courseId: string;
  sectionId: string;
  instructorId: string;
};

export const assignInstructorToSection = async (
  db: Database,
  input: AssignInstructorToSectionInput,
  now = new Date(),
): Promise<CourseSectionInstructorContract> => {
  const parsed = CourseSectionInstructor.parse({
    id: CourseSectionInstructorId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    sectionId: CourseSectionId.parse(input.sectionId),
    instructorId: UserId.parse(input.instructorId),
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseSectionInstructor).values(parsed).returning();
  if (!row) {
    throw new Error(
      'Course section instructor could not be created because the database returned no row.',
    );
  }
  return CourseSectionInstructor.parse(row);
};

export type ListSectionInstructorsForSectionInput = {
  tenantId: string;
  courseId: string;
  sectionId: string;
};

export const listSectionInstructorsForSection = async (
  db: Database,
  input: ListSectionInstructorsForSectionInput,
): Promise<CourseSectionInstructorContract[]> => {
  const rows = await db
    .select()
    .from(courseSectionInstructor)
    .where(
      and(
        eq(courseSectionInstructor.tenantId, input.tenantId),
        eq(courseSectionInstructor.courseId, input.courseId),
        eq(courseSectionInstructor.sectionId, input.sectionId),
      ),
    )
    .orderBy(asc(courseSectionInstructor.instructorId));
  return rows.map((row) => CourseSectionInstructor.parse(row));
};

export type RemoveInstructorFromSectionInput = {
  tenantId: string;
  courseId: string;
  sectionId: string;
  instructorId: string;
};

export const removeInstructorFromSection = async (
  db: Database,
  input: RemoveInstructorFromSectionInput,
): Promise<void> => {
  await db
    .delete(courseSectionInstructor)
    .where(
      and(
        eq(courseSectionInstructor.tenantId, input.tenantId),
        eq(courseSectionInstructor.courseId, input.courseId),
        eq(courseSectionInstructor.sectionId, input.sectionId),
        eq(courseSectionInstructor.instructorId, input.instructorId),
      ),
    );
};
