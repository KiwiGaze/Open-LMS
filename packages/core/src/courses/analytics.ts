import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { assignment } from '../db/schema/assignment.ts';
import { courseCalendarEvent } from '../db/schema/calendar.ts';
import { discussionTopic } from '../db/schema/discussion.ts';
import { courseMembership } from '../db/schema/membership.ts';
import { quiz } from '../db/schema/quiz.ts';
import { submission } from '../db/schema/submission.ts';

export type CourseAnalyticsSummary = {
  enrolledStudents: number;
  publishedAssignments: number;
  publishedQuizzes: number;
  publishedCalendarEvents: number;
  publishedDiscussionTopics: number;
  totalSubmissions: number;
};

export type GetCourseAnalyticsSummaryInput = {
  tenantId: string;
  courseId: string;
};

const countOne = (rows: Array<{ value: number }>): number => Number(rows[0]?.value ?? 0);

export const getCourseAnalyticsSummary = async (
  db: Database,
  input: GetCourseAnalyticsSummaryInput,
): Promise<CourseAnalyticsSummary> => {
  const [students, assignments, quizzes, calendarEvents, discussionTopics, submissions] =
    await Promise.all([
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(courseMembership)
        .where(
          and(
            eq(courseMembership.tenantId, input.tenantId),
            eq(courseMembership.courseId, input.courseId),
            eq(courseMembership.role, 'student'),
          ),
        ),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(assignment)
        .where(
          and(
            eq(assignment.tenantId, input.tenantId),
            eq(assignment.courseId, input.courseId),
            eq(assignment.status, 'published'),
          ),
        ),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(quiz)
        .where(
          and(
            eq(quiz.tenantId, input.tenantId),
            eq(quiz.courseId, input.courseId),
            eq(quiz.status, 'published'),
          ),
        ),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(courseCalendarEvent)
        .where(
          and(
            eq(courseCalendarEvent.tenantId, input.tenantId),
            eq(courseCalendarEvent.courseId, input.courseId),
            eq(courseCalendarEvent.visibility, 'published'),
          ),
        ),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(discussionTopic)
        .where(
          and(
            eq(discussionTopic.tenantId, input.tenantId),
            eq(discussionTopic.courseId, input.courseId),
            eq(discussionTopic.visibility, 'published'),
          ),
        ),
      db
        .select({ value: sql<number>`count(*)::int` })
        .from(submission)
        .innerJoin(
          assignment,
          and(
            eq(submission.tenantId, assignment.tenantId),
            eq(submission.assignmentId, assignment.id),
          ),
        )
        .where(
          and(eq(assignment.tenantId, input.tenantId), eq(assignment.courseId, input.courseId)),
        ),
    ]);

  return {
    enrolledStudents: countOne(students),
    publishedAssignments: countOne(assignments),
    publishedQuizzes: countOne(quizzes),
    publishedCalendarEvents: countOne(calendarEvents),
    publishedDiscussionTopics: countOne(discussionTopics),
    totalSubmissions: countOne(submissions),
  };
};
