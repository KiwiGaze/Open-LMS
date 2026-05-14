import {
  CourseId,
  CourseResourceId,
  CourseResourceViewEvent,
  type CourseResourceViewEvent as CourseResourceViewEventContract,
  CourseResourceViewEventId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, desc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import { courseResourceViewEvent } from '../db/schema/resource-view.ts';

export type RecordResourceViewInput = {
  tenantId: string;
  courseId: string;
  resourceId: string;
  viewerId: string;
  viewedAt: Date;
};

export const recordResourceView = async (
  db: DatabaseExecutor,
  input: RecordResourceViewInput,
  now = new Date(),
): Promise<CourseResourceViewEventContract> => {
  const parsed = CourseResourceViewEvent.parse({
    id: CourseResourceViewEventId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    resourceId: CourseResourceId.parse(input.resourceId),
    viewerId: UserId.parse(input.viewerId),
    viewedAt: input.viewedAt,
    createdAt: now,
  });
  const [row] = await db.insert(courseResourceViewEvent).values(parsed).returning();
  if (!row) {
    throw new Error(
      'Course resource view event could not be recorded because the database returned no row.',
    );
  }
  return CourseResourceViewEvent.parse(row);
};

export type ListResourceViewsForResourceInput = {
  tenantId: string;
  resourceId: string;
  viewerId?: string;
};

export const listResourceViewsForResource = async (
  db: Database,
  input: ListResourceViewsForResourceInput,
): Promise<CourseResourceViewEventContract[]> => {
  const conditions = [
    eq(courseResourceViewEvent.tenantId, input.tenantId),
    eq(courseResourceViewEvent.resourceId, input.resourceId),
  ];
  if (input.viewerId) {
    conditions.push(eq(courseResourceViewEvent.viewerId, input.viewerId));
  }
  const rows = await db
    .select()
    .from(courseResourceViewEvent)
    .where(and(...conditions))
    .orderBy(desc(courseResourceViewEvent.viewedAt));
  return rows.map((row) => CourseResourceViewEvent.parse(row));
};

export type ListResourceViewsForViewerInput = {
  tenantId: string;
  courseId: string;
  viewerId: string;
};

export const listResourceViewsForViewer = async (
  db: Database,
  input: ListResourceViewsForViewerInput,
): Promise<CourseResourceViewEventContract[]> => {
  const rows = await db
    .select()
    .from(courseResourceViewEvent)
    .where(
      and(
        eq(courseResourceViewEvent.tenantId, input.tenantId),
        eq(courseResourceViewEvent.courseId, input.courseId),
        eq(courseResourceViewEvent.viewerId, input.viewerId),
      ),
    )
    .orderBy(desc(courseResourceViewEvent.viewedAt));
  return rows.map((row) => CourseResourceViewEvent.parse(row));
};
