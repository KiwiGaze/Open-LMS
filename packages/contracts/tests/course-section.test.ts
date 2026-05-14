import { describe, expect, it } from 'vitest';
import { CourseSection, CourseSyllabus } from '../src/course.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('course section contracts', () => {
  it('accepts course sections with status and display order', () => {
    expect(
      CourseSection.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE40',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        name: 'Section A',
        status: 'active',
        position: 0,
        meetingDays: ['monday', 'wednesday'],
        meetingStartTime: '09:30',
        meetingEndTime: '10:45',
        location: 'Room 204',
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: '01J9QW7B6N5W2YH3D3A1V0KE40',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      name: 'Section A',
      status: 'active',
      position: 0,
      meetingDays: ['monday', 'wednesday'],
      meetingStartTime: '09:30',
      meetingEndTime: '10:45',
      location: 'Room 204',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('requires meeting days and time range to be supplied together', () => {
    const section = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE40',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      name: 'Section A',
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    };

    expect(() =>
      CourseSection.parse({
        ...section,
        meetingDays: ['monday'],
        meetingStartTime: null,
        meetingEndTime: '10:45',
      }),
    ).toThrow();

    expect(() =>
      CourseSection.parse({
        ...section,
        meetingDays: [],
        meetingStartTime: '09:30',
        meetingEndTime: null,
      }),
    ).toThrow();

    expect(() =>
      CourseSection.parse({
        ...section,
        meetingDays: [],
        meetingStartTime: '09:30',
        meetingEndTime: '10:45',
      }),
    ).toThrow();
  });

  it('rejects section meeting end times that are not after start times', () => {
    expect(() =>
      CourseSection.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE40',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        name: 'Section A',
        status: 'active',
        position: 0,
        meetingDays: ['monday'],
        meetingStartTime: '10:45',
        meetingEndTime: '09:30',
        location: null,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('accepts a canonical course syllabus with publication state', () => {
    expect(
      CourseSyllabus.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE41',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
        body: 'Course policies, grading expectations, and weekly rhythm.',
        visibility: 'published',
        version: 1,
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: '01J9QW7B6N5W2YH3D3A1V0KE41',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      body: 'Course policies, grading expectations, and weekly rhythm.',
      visibility: 'published',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  });
});
