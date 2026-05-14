import {
  CourseCalendarEventId,
  type CourseCalendarEventReminder,
  CourseCalendarEventReminderId,
  CourseId,
  type CourseMembership,
  CourseMembershipId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import { produceDueCourseCalendarReminderNotifications } from '../src/calendar/reminders.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE2T');
const courseId = CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE2V');
const eventId = CourseCalendarEventId.parse('01J9QW7B6N5W2YH3D3A1V0KE33');
const reminderId = CourseCalendarEventReminderId.parse('01J9QW7B6N5W2YH3D3A1V0KE44');
const studentId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE45');
const instructorId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE46');
const now = new Date('2026-05-10T00:00:00.000Z');
const eventStartsAt = new Date('2026-05-10T01:00:00.000Z');

const reminder: CourseCalendarEventReminder & {
  eventTitle: string;
  eventStartsAt: Date;
} = {
  id: reminderId,
  tenantId,
  courseId,
  eventId,
  offsetMinutes: 60,
  remindAt: now,
  sentAt: null,
  createdAt: now,
  updatedAt: now,
  eventTitle: 'Essay workshop',
  eventStartsAt,
};

const activeMemberships: CourseMembership[] = [
  {
    id: CourseMembershipId.parse('01J9QW7B6N5W2YH3D3A1V0KE47'),
    tenantId,
    courseId,
    userId: studentId,
    role: 'student',
    status: 'active',
    invitedAt: null,
    acceptedAt: null,
    droppedAt: null,
    withdrawnAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: CourseMembershipId.parse('01J9QW7B6N5W2YH3D3A1V0KE48'),
    tenantId,
    courseId,
    userId: instructorId,
    role: 'instructor',
    status: 'active',
    invitedAt: null,
    acceptedAt: null,
    droppedAt: null,
    withdrawnAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

describe('course calendar reminder notification workflow', () => {
  it('produces reminder notifications for active course members and marks reminders sent', async () => {
    const ports = {
      listDueCourseCalendarEventReminders: vi.fn().mockResolvedValue([reminder]),
      listCourseMemberships: vi.fn().mockResolvedValue(activeMemberships),
      produceNotifications: vi.fn().mockResolvedValue([]),
      markCourseCalendarEventReminderSent: vi.fn().mockResolvedValue({ ...reminder, sentAt: now }),
    };

    await expect(
      produceDueCourseCalendarReminderNotifications(ports, { tenantId, limit: 10, now }),
    ).resolves.toEqual({ remindersProcessed: 1, notificationsRequested: 2 });

    expect(ports.listDueCourseCalendarEventReminders).toHaveBeenCalledWith({
      tenantId,
      now,
      limit: 10,
    });
    expect(ports.listCourseMemberships).toHaveBeenCalledWith({
      tenantId,
      courseId,
      status: 'active',
    });
    expect(ports.produceNotifications).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          recipientId: studentId,
          category: 'calendar_reminder',
          resourceType: 'course_calendar_event',
          resourceId: eventId,
        }),
        expect.objectContaining({
          recipientId: instructorId,
          category: 'calendar_reminder',
          resourceType: 'course_calendar_event',
          resourceId: eventId,
        }),
      ],
      now,
    );
    expect(ports.markCourseCalendarEventReminderSent).toHaveBeenCalledWith({
      tenantId,
      reminderId,
      sentAt: now,
    });
  });

  it('does not mark a reminder sent when notification production fails', async () => {
    const ports = {
      listDueCourseCalendarEventReminders: vi.fn().mockResolvedValue([reminder]),
      listCourseMemberships: vi.fn().mockResolvedValue(activeMemberships),
      produceNotifications: vi.fn().mockRejectedValue(new Error('producer unavailable')),
      markCourseCalendarEventReminderSent: vi.fn(),
    };

    await expect(
      produceDueCourseCalendarReminderNotifications(ports, { tenantId, limit: 10, now }),
    ).rejects.toThrow('producer unavailable');

    expect(ports.markCourseCalendarEventReminderSent).not.toHaveBeenCalled();
  });
});
