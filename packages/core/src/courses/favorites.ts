import {
  CourseFavorite,
  type CourseFavorite as CourseFavoriteContract,
  CourseFavoriteId,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, desc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { courseFavorite } from '../db/schema/course-favorite.ts';

export type FavoriteCourseInput = {
  tenantId: string;
  courseId: string;
  userId: string;
};

// Idempotent: returns the existing favorite if it already exists.
export const favoriteCourse = async (
  db: Database,
  input: FavoriteCourseInput,
  now = new Date(),
): Promise<CourseFavoriteContract> => {
  const [row] = await db
    .insert(courseFavorite)
    .values({
      id: CourseFavoriteId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      userId: UserId.parse(input.userId),
      createdAt: now,
    })
    .onConflictDoNothing({
      target: [courseFavorite.tenantId, courseFavorite.courseId, courseFavorite.userId],
    })
    .returning();

  if (row) {
    return CourseFavorite.parse(row);
  }

  const [existing] = await db
    .select()
    .from(courseFavorite)
    .where(
      and(
        eq(courseFavorite.tenantId, input.tenantId),
        eq(courseFavorite.courseId, input.courseId),
        eq(courseFavorite.userId, input.userId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error(
      'Course favorite could not be read back after an upsert. The database returned no row.',
    );
  }

  return CourseFavorite.parse(existing);
};

export const unfavoriteCourse = async (db: Database, input: FavoriteCourseInput): Promise<void> => {
  await db
    .delete(courseFavorite)
    .where(
      and(
        eq(courseFavorite.tenantId, input.tenantId),
        eq(courseFavorite.courseId, input.courseId),
        eq(courseFavorite.userId, input.userId),
      ),
    );
};

export const listCourseFavoritesForUser = async (
  db: Database,
  tenantId: string,
  userId: string,
): Promise<CourseFavoriteContract[]> => {
  const rows = await db
    .select()
    .from(courseFavorite)
    .where(and(eq(courseFavorite.tenantId, tenantId), eq(courseFavorite.userId, userId)))
    .orderBy(desc(courseFavorite.createdAt));

  return rows.map((row) => CourseFavorite.parse(row));
};
