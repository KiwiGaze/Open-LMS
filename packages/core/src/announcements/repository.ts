import {
  CourseAnnouncement,
  type CourseAnnouncement as CourseAnnouncementContract,
  CourseAnnouncementId,
  type CourseAnnouncementStatus,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import { courseAnnouncement } from '../db/schema/announcement.ts';

export type ListCourseAnnouncementsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: CourseAnnouncementStatus[];
};

export type CreateCourseAnnouncementInput = {
  tenantId: string;
  courseId: string;
  authorId: string;
  title: string;
  body: string;
  status: Extract<CourseAnnouncementStatus, 'draft' | 'published'>;
  pinned: boolean;
};

export const listCourseAnnouncementsForCourse = async (
  db: Database,
  input: ListCourseAnnouncementsForCourseInput,
): Promise<CourseAnnouncementContract[]> => {
  const conditions = [
    eq(courseAnnouncement.tenantId, input.tenantId),
    eq(courseAnnouncement.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(courseAnnouncement.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(courseAnnouncement)
    .where(and(...conditions))
    .orderBy(
      desc(courseAnnouncement.pinned),
      sql`${courseAnnouncement.postedAt} desc nulls last`,
      desc(courseAnnouncement.createdAt),
      desc(courseAnnouncement.id),
    );

  return rows.map((row) => CourseAnnouncement.parse(row));
};

export const createCourseAnnouncement = async (
  db: DatabaseExecutor,
  input: CreateCourseAnnouncementInput,
  now = new Date(),
): Promise<CourseAnnouncementContract> => {
  const parsed = CourseAnnouncement.parse({
    id: CourseAnnouncementId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    authorId: UserId.parse(input.authorId),
    title: input.title,
    body: input.body,
    status: input.status,
    pinned: input.pinned,
    postedAt: input.status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.insert(courseAnnouncement).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Course announcement could not be created because the database returned no row.',
    );
  }

  return CourseAnnouncement.parse(row);
};

export const getCourseAnnouncementForCourse = async (
  db: DatabaseExecutor,
  tenantId: string,
  courseId: string,
  announcementId: string,
): Promise<CourseAnnouncementContract | null> => {
  const [row] = await db
    .select()
    .from(courseAnnouncement)
    .where(
      and(
        eq(courseAnnouncement.tenantId, tenantId),
        eq(courseAnnouncement.courseId, courseId),
        eq(courseAnnouncement.id, announcementId),
      ),
    )
    .limit(1);

  return row ? CourseAnnouncement.parse(row) : null;
};

export type UpdateCourseAnnouncementInput = {
  tenantId: string;
  courseId: string;
  announcementId: string;
  title: string;
  body: string;
  status: Extract<CourseAnnouncementStatus, 'draft' | 'published'>;
  pinned: boolean;
};

export const updateCourseAnnouncement = async (
  db: DatabaseExecutor,
  input: UpdateCourseAnnouncementInput,
  now = new Date(),
): Promise<CourseAnnouncementContract | null> => {
  const [row] = await db
    .update(courseAnnouncement)
    .set({
      title: input.title,
      body: input.body,
      status: input.status,
      pinned: input.pinned,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseAnnouncement.tenantId, input.tenantId),
        eq(courseAnnouncement.courseId, input.courseId),
        eq(courseAnnouncement.id, input.announcementId),
      ),
    )
    .returning();

  return row ? CourseAnnouncement.parse(row) : null;
};

export type DeleteCourseAnnouncementInput = {
  tenantId: string;
  courseId: string;
  announcementId: string;
};

export const deleteCourseAnnouncement = async (
  db: Database,
  input: DeleteCourseAnnouncementInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseAnnouncement)
    .where(
      and(
        eq(courseAnnouncement.tenantId, input.tenantId),
        eq(courseAnnouncement.courseId, input.courseId),
        eq(courseAnnouncement.id, input.announcementId),
      ),
    )
    .returning({ id: courseAnnouncement.id });

  return result.length > 0;
};
