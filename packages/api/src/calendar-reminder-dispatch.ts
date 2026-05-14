import {
  type CourseCalendarReminderNotificationResult,
  createDbHandle,
  listCourseMemberships,
  listDueCourseCalendarEventReminders,
  listNotificationPreferencesForUser,
  markCourseCalendarEventReminderSent,
  produceDueCourseCalendarReminderNotifications,
  produceNotifications,
  saveProducedNotifications,
} from '@openlms/core';

export type CalendarReminderDispatchEnvironment = {
  DATABASE_CONNECTION_STRING?: string;
  CALENDAR_REMINDER_DISPATCH_LIMIT?: string;
};

export type CalendarReminderDispatchOptions = {
  tenantId: string;
  limit?: number;
  now?: Date;
};

export const readCalendarReminderDispatchLimit = (
  environment: Pick<CalendarReminderDispatchEnvironment, 'CALENDAR_REMINDER_DISPATCH_LIMIT'>,
): number => {
  const rawLimit = environment.CALENDAR_REMINDER_DISPATCH_LIMIT;
  if (rawLimit === undefined || rawLimit.trim() === '') {
    return 50;
  }

  if (!/^[1-9]\d*$/.test(rawLimit)) {
    throw new Error('CALENDAR_REMINDER_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  const limit = Number(rawLimit);
  if (limit > 500) {
    throw new Error('CALENDAR_REMINDER_DISPATCH_LIMIT must be an integer between 1 and 500.');
  }

  return limit;
};

const readRequiredDatabaseUrl = (environment: CalendarReminderDispatchEnvironment): string => {
  if (!environment.DATABASE_CONNECTION_STRING) {
    throw new Error('DATABASE_CONNECTION_STRING is required to dispatch calendar reminders.');
  }

  return environment.DATABASE_CONNECTION_STRING;
};

export const dispatchCalendarReminders = async (
  environment: CalendarReminderDispatchEnvironment,
  options: CalendarReminderDispatchOptions,
): Promise<CourseCalendarReminderNotificationResult> => {
  const dbHandle = createDbHandle(readRequiredDatabaseUrl(environment));
  const limit = options.limit ?? readCalendarReminderDispatchLimit(environment);

  try {
    return await produceDueCourseCalendarReminderNotifications(
      {
        listDueCourseCalendarEventReminders: (input) =>
          listDueCourseCalendarEventReminders(dbHandle.db, input),
        listCourseMemberships: (input) => listCourseMemberships(dbHandle.db, input),
        produceNotifications: (inputs, now) =>
          produceNotifications(
            {
              listNotificationPreferencesForUser: (input) =>
                listNotificationPreferencesForUser(dbHandle.db, input),
              saveProducedNotifications: (produced) =>
                saveProducedNotifications(dbHandle.db, produced),
            },
            inputs,
            now,
          ),
        markCourseCalendarEventReminderSent: (input) =>
          markCourseCalendarEventReminderSent(dbHandle.db, input),
      },
      { tenantId: options.tenantId, limit, now: options.now },
    );
  } finally {
    await dbHandle.close();
  }
};
