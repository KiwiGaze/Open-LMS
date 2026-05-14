import {
  CalendarItem,
  type CalendarItem as CalendarItemContract,
  CourseCalendarEvent,
  type CourseCalendarEvent as CourseCalendarEventContract,
  CourseCalendarEventId,
  CourseCalendarEventReminder,
  type CourseCalendarEventReminder as CourseCalendarEventReminderContract,
  CourseCalendarEventReminderId,
  type CourseCalendarEventVisibility,
  CourseId,
  TenantId,
} from '@openlms/contracts';
import { and, asc, eq, isNull, lte, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database, DatabaseExecutor } from '../db/client.ts';
import { assignment, assignmentOverride } from '../db/schema/assignment.ts';
import { courseCalendarEvent, courseCalendarEventReminder } from '../db/schema/calendar.ts';
import { course } from '../db/schema/course.ts';
import { courseGroup, courseGroupMember } from '../db/schema/groups.ts';
import { courseMembership } from '../db/schema/membership.ts';

export const defaultCourseCalendarReminderOffsetsMinutes = [24 * 60, 60] as const;

export type ListCalendarItemsForUserInput = {
  tenantId: string;
  userId: string;
  from: Date;
  to: Date;
};

type AssignmentDueOverrideRow = {
  assignmentId: string;
  dueAt: Date | null;
};

const compareNullableDueDates = (left: Date | null, right: Date | null): number =>
  (left?.getTime() ?? Number.POSITIVE_INFINITY) - (right?.getTime() ?? Number.POSITIVE_INFINITY);

const buildGroupDueDateMap = (rows: AssignmentDueOverrideRow[]): Map<string, Date | null> => {
  const dueDatesByAssignmentId = new Map<string, Date | null>();

  for (const row of rows) {
    const existing = dueDatesByAssignmentId.get(row.assignmentId);

    if (existing === undefined || compareNullableDueDates(row.dueAt, existing) < 0) {
      dueDatesByAssignmentId.set(row.assignmentId, row.dueAt);
    }
  }

  return dueDatesByAssignmentId;
};

export const listCalendarItemsForUser = async (
  db: Database,
  input: ListCalendarItemsForUserInput,
): Promise<CalendarItemContract[]> => {
  const assignmentRows = await db
    .select({
      id: assignment.id,
      tenantId: assignment.tenantId,
      courseId: assignment.courseId,
      courseCode: course.code,
      courseTitle: course.title,
      title: assignment.title,
      baseDueAt: assignment.dueAt,
    })
    .from(assignment)
    .innerJoin(
      course,
      and(eq(course.tenantId, assignment.tenantId), eq(course.id, assignment.courseId)),
    )
    .innerJoin(
      courseMembership,
      and(
        eq(courseMembership.tenantId, assignment.tenantId),
        eq(courseMembership.courseId, assignment.courseId),
        eq(courseMembership.userId, input.userId),
      ),
    )
    .where(and(eq(assignment.tenantId, input.tenantId), eq(assignment.status, 'published')))
    .orderBy(sql`${assignment.dueAt} asc nulls last`, asc(assignment.title));

  const calendarItems = new Map<string, CalendarItemContract>();

  const eventRows = await db
    .select({
      id: courseCalendarEvent.id,
      tenantId: courseCalendarEvent.tenantId,
      courseId: courseCalendarEvent.courseId,
      courseCode: course.code,
      courseTitle: course.title,
      title: courseCalendarEvent.title,
      startsAt: courseCalendarEvent.startsAt,
      endsAt: courseCalendarEvent.endsAt,
    })
    .from(courseCalendarEvent)
    .innerJoin(
      course,
      and(
        eq(course.tenantId, courseCalendarEvent.tenantId),
        eq(course.id, courseCalendarEvent.courseId),
      ),
    )
    .innerJoin(
      courseMembership,
      and(
        eq(courseMembership.tenantId, courseCalendarEvent.tenantId),
        eq(courseMembership.courseId, courseCalendarEvent.courseId),
        eq(courseMembership.userId, input.userId),
      ),
    )
    .where(
      and(
        eq(courseCalendarEvent.tenantId, input.tenantId),
        eq(courseCalendarEvent.visibility, 'published'),
        lte(courseCalendarEvent.startsAt, input.to),
        sql`coalesce(${courseCalendarEvent.endsAt}, ${courseCalendarEvent.startsAt}) >= ${input.from}`,
      ),
    )
    .orderBy(asc(courseCalendarEvent.startsAt), asc(courseCalendarEvent.title));

  const userOverrideRows = await db
    .select({
      assignmentId: assignmentOverride.assignmentId,
      dueAt: assignmentOverride.dueAt,
    })
    .from(assignmentOverride)
    .where(
      and(
        eq(assignmentOverride.tenantId, input.tenantId),
        eq(assignmentOverride.targetType, 'user'),
        eq(assignmentOverride.targetId, input.userId),
        eq(assignmentOverride.status, 'active'),
      ),
    )
    .orderBy(asc(assignmentOverride.assignmentId));

  const groupOverrideRows = await db
    .select({
      assignmentId: assignmentOverride.assignmentId,
      dueAt: assignmentOverride.dueAt,
    })
    .from(assignmentOverride)
    .innerJoin(
      assignment,
      and(
        eq(assignment.tenantId, assignmentOverride.tenantId),
        eq(assignment.id, assignmentOverride.assignmentId),
      ),
    )
    .innerJoin(
      courseGroupMember,
      and(
        eq(courseGroupMember.tenantId, assignmentOverride.tenantId),
        eq(courseGroupMember.groupId, assignmentOverride.targetId),
        eq(courseGroupMember.userId, input.userId),
      ),
    )
    .innerJoin(
      courseGroup,
      and(
        eq(courseGroup.tenantId, assignmentOverride.tenantId),
        eq(courseGroup.id, assignmentOverride.targetId),
        eq(courseGroup.courseId, assignment.courseId),
      ),
    )
    .where(
      and(
        eq(assignmentOverride.tenantId, input.tenantId),
        eq(assignmentOverride.targetType, 'group'),
        eq(assignmentOverride.status, 'active'),
      ),
    )
    .orderBy(asc(assignmentOverride.assignmentId), sql`${assignmentOverride.dueAt} asc nulls last`);

  const userDueDatesByAssignmentId = new Map(
    userOverrideRows.map((row) => [row.assignmentId, row.dueAt]),
  );
  const groupDueDatesByAssignmentId = buildGroupDueDateMap(groupOverrideRows);

  for (const row of assignmentRows) {
    const startsAt = userDueDatesByAssignmentId.has(row.id)
      ? (userDueDatesByAssignmentId.get(row.id) ?? null)
      : groupDueDatesByAssignmentId.has(row.id)
        ? (groupDueDatesByAssignmentId.get(row.id) ?? null)
        : row.baseDueAt;

    if (!startsAt || startsAt < input.from || startsAt > input.to) {
      continue;
    }

    calendarItems.set(
      `assignment_due:${row.id}`,
      CalendarItem.parse({
        id: `assignment_due:${row.id}`,
        tenantId: row.tenantId,
        courseId: row.courseId,
        courseCode: row.courseCode,
        courseTitle: row.courseTitle,
        itemType: 'assignment_due',
        title: row.title,
        startsAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: row.id,
      }),
    );
  }

  for (const row of eventRows) {
    calendarItems.set(
      `course_event:${row.id}`,
      CalendarItem.parse({
        id: `course_event:${row.id}`,
        tenantId: row.tenantId,
        courseId: row.courseId,
        courseCode: row.courseCode,
        courseTitle: row.courseTitle,
        itemType: 'course_event',
        title: row.title,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        sourceType: 'course_calendar_event',
        sourceId: row.id,
      }),
    );
  }

  return [...calendarItems.values()].sort(
    (left, right) =>
      left.startsAt.getTime() - right.startsAt.getTime() || left.title.localeCompare(right.title),
  );
};

export type ListCourseCalendarEventsForCourseInput = {
  tenantId: string;
  courseId: string;
};

export const listCourseCalendarEventsForCourse = async (
  db: Database,
  input: ListCourseCalendarEventsForCourseInput,
): Promise<CourseCalendarEventContract[]> => {
  const rows = await db
    .select()
    .from(courseCalendarEvent)
    .where(
      and(
        eq(courseCalendarEvent.tenantId, input.tenantId),
        eq(courseCalendarEvent.courseId, input.courseId),
      ),
    )
    .orderBy(asc(courseCalendarEvent.startsAt), asc(courseCalendarEvent.id));

  return rows.map((row) => CourseCalendarEvent.parse(row));
};

export type CreateCourseCalendarEventInput = {
  tenantId: string;
  courseId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  visibility: CourseCalendarEventVisibility;
  recurrenceRule: string | null;
};

export const createCourseCalendarEvent = async (
  db: Database,
  input: CreateCourseCalendarEventInput,
  now = new Date(),
): Promise<CourseCalendarEventContract> => {
  return db.transaction(async (tx) => {
    const parsed = CourseCalendarEvent.parse({
      id: CourseCalendarEventId.parse(ulid()),
      tenantId: TenantId.parse(input.tenantId),
      courseId: CourseId.parse(input.courseId),
      title: input.title,
      description: input.description,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      visibility: input.visibility,
      recurrenceRule: input.recurrenceRule,
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await tx.insert(courseCalendarEvent).values(parsed).returning();

    if (!row) {
      throw new Error(
        'Course calendar event could not be created because the database returned no row.',
      );
    }

    const event = CourseCalendarEvent.parse(row);
    await syncDefaultCourseCalendarEventReminders(tx, event, now);
    return event;
  });
};

export const getCourseCalendarEventForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  eventId: string,
): Promise<CourseCalendarEventContract | null> => {
  const [row] = await db
    .select()
    .from(courseCalendarEvent)
    .where(
      and(
        eq(courseCalendarEvent.tenantId, tenantId),
        eq(courseCalendarEvent.courseId, courseId),
        eq(courseCalendarEvent.id, eventId),
      ),
    )
    .limit(1);

  return row ? CourseCalendarEvent.parse(row) : null;
};

export type UpdateCourseCalendarEventInput = {
  tenantId: string;
  courseId: string;
  eventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  visibility: CourseCalendarEventVisibility;
  recurrenceRule: string | null;
};

export const updateCourseCalendarEvent = async (
  db: Database,
  input: UpdateCourseCalendarEventInput,
  now = new Date(),
): Promise<CourseCalendarEventContract | null> => {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(courseCalendarEvent)
      .set({
        title: input.title,
        description: input.description,
        location: input.location,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        visibility: input.visibility,
        recurrenceRule: input.recurrenceRule,
        updatedAt: now,
      })
      .where(
        and(
          eq(courseCalendarEvent.tenantId, input.tenantId),
          eq(courseCalendarEvent.courseId, input.courseId),
          eq(courseCalendarEvent.id, input.eventId),
        ),
      )
      .returning();

    if (!row) {
      return null;
    }

    const event = CourseCalendarEvent.parse(row);
    await syncDefaultCourseCalendarEventReminders(tx, event, now);
    return event;
  });
};

const buildReminderRow = (
  event: CourseCalendarEventContract,
  offsetMinutes: number,
  now: Date,
): CourseCalendarEventReminderContract =>
  CourseCalendarEventReminder.parse({
    id: CourseCalendarEventReminderId.parse(ulid()),
    tenantId: event.tenantId,
    courseId: event.courseId,
    eventId: event.id,
    offsetMinutes,
    remindAt: new Date(event.startsAt.getTime() - offsetMinutes * 60_000),
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  });

const syncDefaultCourseCalendarEventReminders = async (
  db: DatabaseExecutor,
  event: CourseCalendarEventContract,
  now: Date,
): Promise<void> => {
  await db
    .delete(courseCalendarEventReminder)
    .where(
      and(
        eq(courseCalendarEventReminder.tenantId, event.tenantId),
        eq(courseCalendarEventReminder.eventId, event.id),
        isNull(courseCalendarEventReminder.sentAt),
      ),
    );

  if (event.visibility !== 'published') {
    return;
  }

  await db
    .insert(courseCalendarEventReminder)
    .values(
      defaultCourseCalendarReminderOffsetsMinutes.map((offsetMinutes) =>
        buildReminderRow(event, offsetMinutes, now),
      ),
    )
    .onConflictDoNothing();
};

export type DueCourseCalendarEventReminder = CourseCalendarEventReminderContract & {
  eventTitle: string;
  eventStartsAt: Date;
};

export type ListDueCourseCalendarEventRemindersInput = {
  tenantId: string;
  now: Date;
  limit: number;
};

export const listDueCourseCalendarEventReminders = async (
  db: Database,
  input: ListDueCourseCalendarEventRemindersInput,
): Promise<DueCourseCalendarEventReminder[]> => {
  const rows = await db
    .select({
      id: courseCalendarEventReminder.id,
      tenantId: courseCalendarEventReminder.tenantId,
      courseId: courseCalendarEventReminder.courseId,
      eventId: courseCalendarEventReminder.eventId,
      offsetMinutes: courseCalendarEventReminder.offsetMinutes,
      remindAt: courseCalendarEventReminder.remindAt,
      sentAt: courseCalendarEventReminder.sentAt,
      createdAt: courseCalendarEventReminder.createdAt,
      updatedAt: courseCalendarEventReminder.updatedAt,
      eventTitle: courseCalendarEvent.title,
      eventStartsAt: courseCalendarEvent.startsAt,
    })
    .from(courseCalendarEventReminder)
    .innerJoin(
      courseCalendarEvent,
      and(
        eq(courseCalendarEvent.tenantId, courseCalendarEventReminder.tenantId),
        eq(courseCalendarEvent.id, courseCalendarEventReminder.eventId),
      ),
    )
    .where(
      and(
        eq(courseCalendarEventReminder.tenantId, input.tenantId),
        isNull(courseCalendarEventReminder.sentAt),
        lte(courseCalendarEventReminder.remindAt, input.now),
        eq(courseCalendarEvent.visibility, 'published'),
      ),
    )
    .orderBy(asc(courseCalendarEventReminder.remindAt), asc(courseCalendarEventReminder.id))
    .limit(input.limit);

  return rows.map((row) => ({
    ...CourseCalendarEventReminder.parse({
      id: row.id,
      tenantId: row.tenantId,
      courseId: row.courseId,
      eventId: row.eventId,
      offsetMinutes: row.offsetMinutes,
      remindAt: row.remindAt,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
    eventTitle: row.eventTitle,
    eventStartsAt: row.eventStartsAt,
  }));
};

export type MarkCourseCalendarEventReminderSentInput = {
  tenantId: string;
  reminderId: string;
  sentAt: Date;
};

export const markCourseCalendarEventReminderSent = async (
  db: Database,
  input: MarkCourseCalendarEventReminderSentInput,
): Promise<CourseCalendarEventReminderContract | null> => {
  const [row] = await db
    .update(courseCalendarEventReminder)
    .set({ sentAt: input.sentAt, updatedAt: input.sentAt })
    .where(
      and(
        eq(courseCalendarEventReminder.tenantId, input.tenantId),
        eq(courseCalendarEventReminder.id, input.reminderId),
        isNull(courseCalendarEventReminder.sentAt),
      ),
    )
    .returning();

  return row ? CourseCalendarEventReminder.parse(row) : null;
};

export type DeleteCourseCalendarEventInput = {
  tenantId: string;
  courseId: string;
  eventId: string;
};

export const deleteCourseCalendarEvent = async (
  db: Database,
  input: DeleteCourseCalendarEventInput,
): Promise<boolean> => {
  const result = await db
    .delete(courseCalendarEvent)
    .where(
      and(
        eq(courseCalendarEvent.tenantId, input.tenantId),
        eq(courseCalendarEvent.courseId, input.courseId),
        eq(courseCalendarEvent.id, input.eventId),
      ),
    )
    .returning({ id: courseCalendarEvent.id });

  return result.length > 0;
};
