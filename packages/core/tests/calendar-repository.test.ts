import {
  Assignment,
  AssignmentOverride,
  CalendarItem,
  Course,
  CourseCalendarEvent,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { listCalendarItemsForUser } from '../src/calendar/repository.ts';
import type { Database } from '../src/db/client.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const otherCourseId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const userId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE38';
const now = new Date('2026-05-10T00:00:00.000Z');
const from = new Date('2026-05-11T00:00:00.000Z');
const to = new Date('2026-05-18T00:00:00.000Z');

const course = Course.parse({
  id: courseId,
  tenantId,
  code: 'ENG101',
  title: 'Writing Studio',
  status: 'active',
  startsAt: null,
  endsAt: null,
  createdAt: now,
  updatedAt: now,
});

const visibleAssignment = Assignment.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  tenantId,
  courseId,
  title: 'Evidence essay',
  instructions: 'Write an essay using textual evidence.',
  status: 'published',
  dueAt: new Date('2026-05-12T03:00:00.000Z'),
  allowResubmission: true,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: true,
    feedbackDraftEnabled: true,
    scoreSuggestionEnabled: false,
  },
  createdAt: now,
  updatedAt: now,
});

const draftAssignment = Assignment.parse({
  ...visibleAssignment,
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  status: 'draft',
});

const undatedAssignment = Assignment.parse({
  ...visibleAssignment,
  id: '01J9QW7B6N5W2YH3D3A1V0KE30',
  dueAt: null,
});

const otherCourseAssignment = Assignment.parse({
  ...visibleAssignment,
  id: '01J9QW7B6N5W2YH3D3A1V0KE31',
  courseId: otherCourseId,
});

const laterAssignment = Assignment.parse({
  ...visibleAssignment,
  id: '01J9QW7B6N5W2YH3D3A1V0KE39',
  title: 'Annotated bibliography',
  dueAt: new Date('2026-05-20T03:00:00.000Z'),
});

const userDueDateOverride = AssignmentOverride.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3A',
  tenantId,
  assignmentId: visibleAssignment.id,
  targetType: 'user',
  targetId: userId,
  opensAt: null,
  dueAt: new Date('2026-05-16T03:00:00.000Z'),
  closesAt: null,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const groupDueDateOverride = AssignmentOverride.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE3B',
  tenantId,
  assignmentId: visibleAssignment.id,
  targetType: 'group',
  targetId: groupId,
  opensAt: null,
  dueAt: new Date('2026-05-14T03:00:00.000Z'),
  closesAt: null,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const clearedGroupDueDateOverride = AssignmentOverride.parse({
  ...groupDueDateOverride,
  id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
  dueAt: null,
});

const wrongCourseGroupDueDateOverride = AssignmentOverride.parse({
  ...groupDueDateOverride,
  id: '01J9QW7B6N5W2YH3D3A1V0KE3F',
  dueAt: new Date('2026-05-17T03:00:00.000Z'),
});

const archivedGroupDueDateOverride = AssignmentOverride.parse({
  ...groupDueDateOverride,
  id: '01J9QW7B6N5W2YH3D3A1V0KE3C',
  dueAt: new Date('2026-05-15T03:00:00.000Z'),
  status: 'archived',
});

const laterUserDueDateOverride = AssignmentOverride.parse({
  ...userDueDateOverride,
  id: '01J9QW7B6N5W2YH3D3A1V0KE3D',
  assignmentId: laterAssignment.id,
  dueAt: new Date('2026-05-13T03:00:00.000Z'),
});

const undatedUserDueDateOverride = AssignmentOverride.parse({
  ...userDueDateOverride,
  id: '01J9QW7B6N5W2YH3D3A1V0KE3G',
  assignmentId: undatedAssignment.id,
  dueAt: new Date('2026-05-13T03:00:00.000Z'),
});

const visibleCourseEvent = CourseCalendarEvent.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE33',
  tenantId,
  courseId,
  title: 'Essay workshop',
  description: 'Bring a printed draft for peer review.',
  location: 'Room 204',
  startsAt: new Date('2026-05-11T02:00:00.000Z'),
  endsAt: new Date('2026-05-11T03:00:00.000Z'),
  visibility: 'published',
  recurrenceRule: null,
  createdAt: now,
  updatedAt: now,
});

const draftCourseEvent = CourseCalendarEvent.parse({
  ...visibleCourseEvent,
  id: '01J9QW7B6N5W2YH3D3A1V0KE34',
  visibility: 'draft',
});

const otherCourseEvent = CourseCalendarEvent.parse({
  ...visibleCourseEvent,
  id: '01J9QW7B6N5W2YH3D3A1V0KE35',
  courseId: otherCourseId,
});

const overlappingCourseEvent = CourseCalendarEvent.parse({
  ...visibleCourseEvent,
  id: '01J9QW7B6N5W2YH3D3A1V0KE37',
  title: 'Drafting retreat',
  startsAt: new Date('2026-05-10T20:00:00.000Z'),
  endsAt: new Date('2026-05-11T01:00:00.000Z'),
});

type CalendarRow = {
  assignment: Assignment;
  course: Course;
  memberUserId: string;
};

type CalendarEventRow = {
  event: CourseCalendarEvent;
  course: Course;
  memberUserId: string;
};

type GroupOverrideRow = {
  override: AssignmentOverride;
  groupMemberUserId: string;
  groupCourseId: string;
};

const createCalendarDb = (
  rows: CalendarRow[],
  eventRows: CalendarEventRow[] = [],
  userOverrides: AssignmentOverride[] = [],
  groupOverrides: GroupOverrideRow[] = [],
): Database => {
  let selectCount = 0;

  return {
    select: () => {
      selectCount += 1;

      return {
        from: () => ({
          where: () => ({
            orderBy: async () =>
              selectCount === 3
                ? userOverrides
                    .filter((override) => override.tenantId === tenantId)
                    .filter((override) => override.targetType === 'user')
                    .filter((override) => override.targetId === userId)
                    .filter((override) => override.status === 'active')
                    .map((override) => ({
                      assignmentId: override.assignmentId,
                      dueAt: override.dueAt,
                    }))
                : [],
          }),
          innerJoin: () => ({
            where: () => ({
              orderBy: async () =>
                selectCount === 4
                  ? groupOverrides
                      .filter((row) => row.groupMemberUserId === userId)
                      .filter((row) => row.override.tenantId === tenantId)
                      .filter((row) => row.override.targetType === 'group')
                      .filter((row) => row.override.status === 'active')
                      .filter((row) =>
                        rows.some(
                          (assignmentRow) =>
                            assignmentRow.assignment.id === row.override.assignmentId &&
                            assignmentRow.assignment.courseId === row.groupCourseId,
                        ),
                      )
                      .map((row) => ({
                        assignmentId: row.override.assignmentId,
                        dueAt: row.override.dueAt,
                      }))
                  : [],
            }),
            innerJoin: () => ({
              where: () => ({
                orderBy: async () =>
                  selectCount === 1
                    ? rows
                        .filter((row) => row.memberUserId === userId)
                        .filter((row) => row.assignment.tenantId === tenantId)
                        .filter((row) => row.assignment.courseId === row.course.id)
                        .filter((row) => row.assignment.status === 'published')
                        .sort((left, right) => {
                          const dueAtDelta =
                            (left.assignment.dueAt?.getTime() ?? 0) -
                            (right.assignment.dueAt?.getTime() ?? 0);

                          return (
                            dueAtDelta ||
                            left.assignment.title.localeCompare(right.assignment.title)
                          );
                        })
                        .map((row) => ({
                          id: row.assignment.id,
                          tenantId: row.assignment.tenantId,
                          courseId: row.assignment.courseId,
                          courseCode: row.course.code,
                          courseTitle: row.course.title,
                          title: row.assignment.title,
                          baseDueAt: row.assignment.dueAt,
                        }))
                    : selectCount === 2
                      ? eventRows
                          .filter((row) => row.memberUserId === userId)
                          .filter((row) => row.event.tenantId === tenantId)
                          .filter((row) => row.event.courseId === row.course.id)
                          .filter((row) => row.event.visibility === 'published')
                          .filter(
                            (row) =>
                              row.event.startsAt <= to &&
                              (row.event.endsAt ?? row.event.startsAt) >= from,
                          )
                          .sort(
                            (left, right) =>
                              left.event.startsAt.getTime() - right.event.startsAt.getTime() ||
                              left.event.title.localeCompare(right.event.title),
                          )
                          .map((row) => ({
                            id: row.event.id,
                            tenantId: row.event.tenantId,
                            courseId: row.event.courseId,
                            courseCode: row.course.code,
                            courseTitle: row.course.title,
                            title: row.event.title,
                            startsAt: row.event.startsAt,
                            endsAt: row.event.endsAt,
                          }))
                      : [],
              }),
              innerJoin: () => ({
                where: () => ({
                  orderBy: async () =>
                    selectCount === 4
                      ? groupOverrides
                          .filter((row) => row.groupMemberUserId === userId)
                          .filter((row) => row.override.tenantId === tenantId)
                          .filter((row) => row.override.targetType === 'group')
                          .filter((row) => row.override.status === 'active')
                          .filter((row) =>
                            rows.some(
                              (assignmentRow) =>
                                assignmentRow.assignment.id === row.override.assignmentId &&
                                assignmentRow.assignment.courseId === row.groupCourseId,
                            ),
                          )
                          .map((row) => ({
                            assignmentId: row.override.assignmentId,
                            dueAt: row.override.dueAt,
                          }))
                      : [],
                }),
              }),
            }),
          }),
        }),
      };
    },
  } as unknown as Database;
};

describe('calendar repository', () => {
  it('lists published assignment due dates and course events where the user is enrolled', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [
            { assignment: visibleAssignment, course, memberUserId: userId },
            { assignment: visibleAssignment, course, memberUserId: userId },
            { assignment: draftAssignment, course, memberUserId: userId },
            { assignment: undatedAssignment, course, memberUserId: userId },
            { assignment: otherCourseAssignment, course, memberUserId: userId },
            {
              assignment: visibleAssignment,
              course,
              memberUserId: '01J9QW7B6N5W2YH3D3A1V0KE32',
            },
          ],
          [
            { event: visibleCourseEvent, course, memberUserId: userId },
            { event: overlappingCourseEvent, course, memberUserId: userId },
            { event: draftCourseEvent, course, memberUserId: userId },
            { event: otherCourseEvent, course, memberUserId: userId },
            {
              event: visibleCourseEvent,
              course,
              memberUserId: '01J9QW7B6N5W2YH3D3A1V0KE36',
            },
          ],
        ),
        {
          tenantId,
          userId,
          from,
          to,
        },
      ),
    ).resolves.toEqual([
      CalendarItem.parse({
        id: `course_event:${overlappingCourseEvent.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'course_event',
        title: 'Drafting retreat',
        startsAt: overlappingCourseEvent.startsAt,
        endsAt: overlappingCourseEvent.endsAt,
        sourceType: 'course_calendar_event',
        sourceId: overlappingCourseEvent.id,
      }),
      CalendarItem.parse({
        id: `course_event:${visibleCourseEvent.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'course_event',
        title: 'Essay workshop',
        startsAt: visibleCourseEvent.startsAt,
        endsAt: visibleCourseEvent.endsAt,
        sourceType: 'course_calendar_event',
        sourceId: visibleCourseEvent.id,
      }),
      CalendarItem.parse({
        id: `assignment_due:${visibleAssignment.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Evidence essay',
        startsAt: visibleAssignment.dueAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: visibleAssignment.id,
      }),
    ]);
  });

  it('uses a user assignment override as the effective due date', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [{ assignment: visibleAssignment, course, memberUserId: userId }],
          [],
          [userDueDateOverride],
        ),
        { tenantId, userId, from, to },
      ),
    ).resolves.toEqual([
      CalendarItem.parse({
        id: `assignment_due:${visibleAssignment.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Evidence essay',
        startsAt: userDueDateOverride.dueAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: visibleAssignment.id,
      }),
    ]);
  });

  it('uses active group assignment overrides when no user override exists', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [{ assignment: visibleAssignment, course, memberUserId: userId }],
          [],
          [],
          [
            { override: groupDueDateOverride, groupMemberUserId: userId, groupCourseId: courseId },
            {
              override: archivedGroupDueDateOverride,
              groupMemberUserId: userId,
              groupCourseId: courseId,
            },
          ],
        ),
        { tenantId, userId, from, to },
      ),
    ).resolves.toEqual([
      CalendarItem.parse({
        id: `assignment_due:${visibleAssignment.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Evidence essay',
        startsAt: groupDueDateOverride.dueAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: visibleAssignment.id,
      }),
    ]);
  });

  it('honors a group override that clears the base assignment due date', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [{ assignment: visibleAssignment, course, memberUserId: userId }],
          [],
          [],
          [
            {
              override: clearedGroupDueDateOverride,
              groupMemberUserId: userId,
              groupCourseId: courseId,
            },
          ],
        ),
        { tenantId, userId, from, to },
      ),
    ).resolves.toEqual([]);
  });

  it('ignores group overrides from groups outside the assignment course', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [{ assignment: visibleAssignment, course, memberUserId: userId }],
          [],
          [],
          [
            {
              override: wrongCourseGroupDueDateOverride,
              groupMemberUserId: userId,
              groupCourseId: otherCourseId,
            },
          ],
        ),
        { tenantId, userId, from, to },
      ),
    ).resolves.toEqual([
      CalendarItem.parse({
        id: `assignment_due:${visibleAssignment.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Evidence essay',
        startsAt: visibleAssignment.dueAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: visibleAssignment.id,
      }),
    ]);
  });

  it('lists assignments whose override due date falls inside the requested window', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [{ assignment: laterAssignment, course, memberUserId: userId }],
          [],
          [laterUserDueDateOverride],
        ),
        { tenantId, userId, from, to },
      ),
    ).resolves.toEqual([
      CalendarItem.parse({
        id: `assignment_due:${laterAssignment.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Annotated bibliography',
        startsAt: laterUserDueDateOverride.dueAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: laterAssignment.id,
      }),
    ]);
  });

  it('lists undated assignments when an override due date falls inside the requested window', async () => {
    await expect(
      listCalendarItemsForUser(
        createCalendarDb(
          [{ assignment: undatedAssignment, course, memberUserId: userId }],
          [],
          [undatedUserDueDateOverride],
        ),
        { tenantId, userId, from, to },
      ),
    ).resolves.toEqual([
      CalendarItem.parse({
        id: `assignment_due:${undatedAssignment.id}`,
        tenantId,
        courseId,
        courseCode: 'ENG101',
        courseTitle: 'Writing Studio',
        itemType: 'assignment_due',
        title: 'Evidence essay',
        startsAt: undatedUserDueDateOverride.dueAt,
        endsAt: null,
        sourceType: 'assignment',
        sourceId: undatedAssignment.id,
      }),
    ]);
  });
});
