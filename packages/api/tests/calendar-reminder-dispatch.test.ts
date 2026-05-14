import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchCalendarReminders,
  readCalendarReminderDispatchLimit,
} from '../src/calendar-reminder-dispatch.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {}, close: vi.fn() },
  listCourseMemberships: vi.fn(),
  listDueCourseCalendarEventReminders: vi.fn(),
  listNotificationPreferencesForUser: vi.fn(),
  markCourseCalendarEventReminderSent: vi.fn(),
  saveProducedNotifications: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    listCourseMemberships: coreMocks.listCourseMemberships,
    listDueCourseCalendarEventReminders: coreMocks.listDueCourseCalendarEventReminders,
    listNotificationPreferencesForUser: coreMocks.listNotificationPreferencesForUser,
    markCourseCalendarEventReminderSent: coreMocks.markCourseCalendarEventReminderSent,
    saveProducedNotifications: coreMocks.saveProducedNotifications,
  };
});

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const now = new Date('2026-05-10T00:00:00.000Z');

describe('calendar reminder dispatcher worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listDueCourseCalendarEventReminders.mockResolvedValue([]);
    coreMocks.listCourseMemberships.mockResolvedValue([]);
    coreMocks.listNotificationPreferencesForUser.mockResolvedValue([]);
    coreMocks.saveProducedNotifications.mockResolvedValue([]);
    coreMocks.markCourseCalendarEventReminderSent.mockResolvedValue(null);
  });

  it('uses a bounded default dispatch limit', () => {
    expect(readCalendarReminderDispatchLimit({})).toBe(50);
    expect(readCalendarReminderDispatchLimit({ CALENDAR_REMINDER_DISPATCH_LIMIT: '25' })).toBe(25);
    expect(() =>
      readCalendarReminderDispatchLimit({ CALENDAR_REMINDER_DISPATCH_LIMIT: '0' }),
    ).toThrow('CALENDAR_REMINDER_DISPATCH_LIMIT must be an integer between 1 and 500.');
  });

  it('dispatches due reminders through core notification production ports', async () => {
    await expect(
      dispatchCalendarReminders(
        { DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms' },
        { tenantId, now },
      ),
    ).resolves.toEqual({ remindersProcessed: 0, notificationsRequested: 0 });

    expect(coreMocks.createDbHandle).toHaveBeenCalledWith(
      'postgresql://openlms:openlms@localhost:5432/openlms',
    );
    expect(coreMocks.listDueCourseCalendarEventReminders).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      { tenantId, now, limit: 50 },
    );
    expect(coreMocks.dbHandle.close).toHaveBeenCalled();
  });
});
