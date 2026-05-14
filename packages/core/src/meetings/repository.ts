import {
  CourseId,
  CourseMeeting,
  type CourseMeeting as CourseMeetingContract,
  CourseMeetingId,
  type CourseMeetingProvider,
  type CourseMeetingStatus,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { courseMeeting } from '../db/schema/meeting.ts';

export type ListCourseMeetingsForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listCourseMeetingsForCourse = async (
  db: Database,
  input: ListCourseMeetingsForCourseInput,
): Promise<CourseMeetingContract[]> => {
  const rows = await db
    .select()
    .from(courseMeeting)
    .where(
      and(eq(courseMeeting.tenantId, input.tenantId), eq(courseMeeting.courseId, input.courseId)),
    )
    .orderBy(asc(courseMeeting.startsAt), asc(courseMeeting.id));

  return rows.map((row) => CourseMeeting.parse(row));
};

export type CreateCourseMeetingInput = {
  tenantId: string;
  courseId: string;
  title: string;
  description: string | null;
  provider: CourseMeetingProvider;
  externalUrl: string;
  startsAt: Date;
  endsAt: Date | null;
  recordingUrl: string | null;
  playbackUrl: string | null;
  status: CourseMeetingStatus;
};

export const createCourseMeeting = async (
  db: Database,
  input: CreateCourseMeetingInput,
  now = new Date(),
): Promise<CourseMeetingContract> => {
  const parsed = CourseMeeting.parse({
    id: CourseMeetingId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    description: input.description,
    provider: input.provider,
    externalUrl: input.externalUrl,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    recordingUrl: input.recordingUrl,
    playbackUrl: input.playbackUrl,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(courseMeeting).values(parsed).returning();

  if (!row) {
    throw new Error('Course meeting could not be created because the database returned no row.');
  }

  return CourseMeeting.parse(row);
};

export const getCourseMeetingForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  meetingId: string,
): Promise<CourseMeetingContract | null> => {
  const [row] = await db
    .select()
    .from(courseMeeting)
    .where(
      and(
        eq(courseMeeting.tenantId, tenantId),
        eq(courseMeeting.courseId, courseId),
        eq(courseMeeting.id, meetingId),
      ),
    )
    .limit(1);

  return row ? CourseMeeting.parse(row) : null;
};

export type UpdateCourseMeetingInput = {
  tenantId: string;
  courseId: string;
  meetingId: string;
  title: string;
  description: string | null;
  provider: CourseMeetingProvider;
  externalUrl: string;
  startsAt: Date;
  endsAt: Date | null;
  recordingUrl: string | null;
  playbackUrl: string | null;
  status: CourseMeetingStatus;
};

export const updateCourseMeeting = async (
  db: Database,
  input: UpdateCourseMeetingInput,
  now = new Date(),
): Promise<CourseMeetingContract | null> => {
  const [row] = await db
    .update(courseMeeting)
    .set({
      title: input.title,
      description: input.description,
      provider: input.provider,
      externalUrl: input.externalUrl,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      recordingUrl: input.recordingUrl,
      playbackUrl: input.playbackUrl,
      status: input.status,
      updatedAt: now,
    })
    .where(
      and(
        eq(courseMeeting.tenantId, input.tenantId),
        eq(courseMeeting.courseId, input.courseId),
        eq(courseMeeting.id, input.meetingId),
      ),
    )
    .returning();

  return row ? CourseMeeting.parse(row) : null;
};

export type DeleteCourseMeetingInput = {
  tenantId: string;
  courseId: string;
  meetingId: string;
};

export const deleteCourseMeeting = async (
  db: Database,
  input: DeleteCourseMeetingInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseMeeting)
    .where(
      and(
        eq(courseMeeting.tenantId, input.tenantId),
        eq(courseMeeting.courseId, input.courseId),
        eq(courseMeeting.id, input.meetingId),
      ),
    )
    .returning({ id: courseMeeting.id });

  return result.length > 0;
};
