import type { CourseMembership } from '@openlms/contracts';
import type { NotificationIntent, ProducedNotification } from '../notifications/delivery.ts';
import type { DueCourseCalendarEventReminder } from './repository.ts';

export type CourseCalendarReminderNotificationResult = {
  remindersProcessed: number;
  notificationsRequested: number;
};

export type CourseCalendarReminderNotificationPorts = {
  listDueCourseCalendarEventReminders: (input: {
    tenantId: string;
    now: Date;
    limit: number;
  }) => Promise<DueCourseCalendarEventReminder[]>;
  listCourseMemberships: (input: {
    tenantId: string;
    courseId: string;
    status: 'active';
  }) => Promise<CourseMembership[]>;
  produceNotifications: (
    inputs: NotificationIntent[],
    now: Date,
  ) => Promise<ProducedNotification[]>;
  markCourseCalendarEventReminderSent: (input: {
    tenantId: string;
    reminderId: string;
    sentAt: Date;
  }) => Promise<unknown>;
};

const buildReminderBody = (reminder: DueCourseCalendarEventReminder): string =>
  `${reminder.eventTitle} starts at ${reminder.eventStartsAt.toISOString()}.`;

const buildReminderIntent = (
  reminder: DueCourseCalendarEventReminder,
  recipientId: string,
): NotificationIntent => ({
  tenantId: reminder.tenantId,
  recipientId,
  category: 'calendar_reminder',
  title: `Upcoming event: ${reminder.eventTitle}`,
  body: buildReminderBody(reminder),
  resourceType: 'course_calendar_event',
  resourceId: reminder.eventId,
});

export const produceDueCourseCalendarReminderNotifications = async (
  ports: CourseCalendarReminderNotificationPorts,
  input: { tenantId: string; limit: number; now?: Date },
): Promise<CourseCalendarReminderNotificationResult> => {
  const now = input.now ?? new Date();
  const reminders = await ports.listDueCourseCalendarEventReminders({
    tenantId: input.tenantId,
    now,
    limit: input.limit,
  });
  const result: CourseCalendarReminderNotificationResult = {
    remindersProcessed: 0,
    notificationsRequested: 0,
  };

  for (const reminder of reminders) {
    const memberships = await ports.listCourseMemberships({
      tenantId: reminder.tenantId,
      courseId: reminder.courseId,
      status: 'active',
    });
    const recipientIds = Array.from(new Set(memberships.map((membership) => membership.userId)));
    const intents = recipientIds.map((recipientId) => buildReminderIntent(reminder, recipientId));

    if (intents.length > 0) {
      await ports.produceNotifications(intents, now);
    }

    await ports.markCourseCalendarEventReminderSent({
      tenantId: reminder.tenantId,
      reminderId: reminder.id,
      sentAt: now,
    });
    result.remindersProcessed += 1;
    result.notificationsRequested += intents.length;
  }

  return result;
};
