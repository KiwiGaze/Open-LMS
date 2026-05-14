import { z } from 'zod';
import {
  AssignmentId,
  CourseCalendarEventId,
  CourseCalendarEventReminderId,
  CourseId,
  TenantId,
} from './ids.ts';

export const CourseCalendarEventVisibility = z.enum(['draft', 'published', 'archived']);
export type CourseCalendarEventVisibility = z.infer<typeof CourseCalendarEventVisibility>;

export const CourseCalendarEvent = z
  .object({
    id: CourseCalendarEventId,
    tenantId: TenantId,
    courseId: CourseId,
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(2_000).nullable(),
    location: z.string().min(1).max(180).nullable(),
    startsAt: z.date(),
    endsAt: z.date().nullable(),
    visibility: CourseCalendarEventVisibility,
    recurrenceRule: z.string().min(1).max(1_000).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((event, context) => {
    if (event.endsAt && event.endsAt.getTime() <= event.startsAt.getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Course calendar event end time must be after the start time.',
        path: ['endsAt'],
      });
    }
  });
export type CourseCalendarEvent = z.infer<typeof CourseCalendarEvent>;

export const CourseCalendarEventOccurrence = z
  .object({
    eventId: CourseCalendarEventId,
    tenantId: TenantId,
    courseId: CourseId,
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(2_000).nullable(),
    location: z.string().min(1).max(180).nullable(),
    visibility: CourseCalendarEventVisibility,
    occurrenceStartsAt: z.date(),
    occurrenceEndsAt: z.date().nullable(),
  })
  .strict();
export type CourseCalendarEventOccurrence = z.infer<typeof CourseCalendarEventOccurrence>;

export const CourseCalendarEventReminder = z
  .object({
    id: CourseCalendarEventReminderId,
    tenantId: TenantId,
    courseId: CourseId,
    eventId: CourseCalendarEventId,
    offsetMinutes: z.number().int().positive().max(10_080),
    remindAt: z.date(),
    sentAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type CourseCalendarEventReminder = z.infer<typeof CourseCalendarEventReminder>;

export const CalendarItemType = z.enum(['assignment_due', 'course_event']);
export type CalendarItemType = z.infer<typeof CalendarItemType>;

export const CalendarSourceType = z.enum(['assignment', 'course_calendar_event']);
export type CalendarSourceType = z.infer<typeof CalendarSourceType>;

export const CalendarItem = z
  .object({
    id: z.string().min(1),
    tenantId: TenantId,
    courseId: CourseId,
    courseCode: z.string().min(1).max(32),
    courseTitle: z.string().min(1).max(160),
    itemType: CalendarItemType,
    title: z.string().min(1).max(180),
    startsAt: z.date(),
    endsAt: z.date().nullable(),
    sourceType: CalendarSourceType,
    sourceId: z.union([AssignmentId, CourseCalendarEventId]),
  })
  .strict();
export type CalendarItem = z.infer<typeof CalendarItem>;
