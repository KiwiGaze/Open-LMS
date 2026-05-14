import { describe, expect, it } from 'vitest';
import { CourseCalendarEventReminder } from '../src/calendar.ts';
import { CatalogCourse, Course, CourseCatalogSettings } from '../src/course.ts';

const now = new Date('2026-05-12T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const reminderId = '01J9QW7B6N5W2YH3D3A1V0KE88';

describe('course catalog contracts', () => {
  it('defaults catalog category and academic term to null on courses', () => {
    expect(
      Course.parse({
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'active',
        startsAt: null,
        endsAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      catalogCategory: null,
      academicTerm: null,
      deletedAt: null,
    });
  });

  it('exposes course soft-deletion state', () => {
    const deletedAt = new Date('2026-05-13T12:00:00.000Z');

    expect(
      Course.parse({
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        status: 'deleted',
        startsAt: null,
        endsAt: null,
        deletedAt,
        createdAt: now,
        updatedAt: deletedAt,
      }),
    ).toMatchObject({
      status: 'deleted',
      deletedAt,
    });
  });

  it('exposes catalog category and academic term on public catalog courses', () => {
    expect(
      CatalogCourse.parse({
        id: courseId,
        tenantId,
        code: 'WRIT-101',
        title: 'Evidence-Based Writing',
        catalogCategory: 'Writing',
        academicTerm: '2026 Fall',
        startsAt: null,
        endsAt: null,
      }),
    ).toMatchObject({
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
    });
  });

  it('stores catalog taxonomy fields with catalog settings', () => {
    expect(
      CourseCatalogSettings.parse({
        tenantId,
        courseId,
        catalogVisibility: 'listed',
        enrollmentCode: 'JOIN-WRIT-101',
        catalogCategory: 'Writing',
        academicTerm: '2026 Fall',
        updatedAt: now,
      }),
    ).toMatchObject({
      catalogCategory: 'Writing',
      academicTerm: '2026 Fall',
    });
  });

  it('stores enrollment approval requirements with catalog settings', () => {
    expect(
      CourseCatalogSettings.parse({
        tenantId,
        courseId,
        catalogVisibility: 'listed',
        enrollmentCode: 'JOIN-WRIT-101',
        catalogCategory: 'Writing',
        academicTerm: '2026 Fall',
        enrollmentApprovalRequired: true,
        updatedAt: now,
      }),
    ).toMatchObject({
      enrollmentApprovalRequired: true,
    });
  });
});

describe('course calendar reminder contracts', () => {
  it('accepts pending event reminders with positive offsets', () => {
    const remindAt = new Date('2026-05-13T11:00:00.000Z');

    expect(
      CourseCalendarEventReminder.parse({
        id: reminderId,
        tenantId,
        courseId,
        eventId,
        offsetMinutes: 60,
        remindAt,
        sentAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      offsetMinutes: 60,
      sentAt: null,
    });
  });
});
