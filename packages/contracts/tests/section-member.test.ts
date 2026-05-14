import { describe, expect, it } from 'vitest';
import { CourseSectionInstructor, CourseSectionMember } from '../src/index.ts';

const now = new Date('2026-05-14T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const sectionId = '01J9QW7B6N5W2YH3D3A1V0KE2W';

describe('section member contracts', () => {
  it('models students and instructors as separate section assignments', () => {
    const student = CourseSectionMember.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      tenantId,
      courseId,
      sectionId,
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
      createdAt: now,
      updatedAt: now,
    });
    const instructor = CourseSectionInstructor.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
      tenantId,
      courseId,
      sectionId,
      instructorId: '01J9QW7B6N5W2YH3D3A1V0KE30',
      createdAt: now,
      updatedAt: now,
    });

    expect(student.studentId).toBe('01J9QW7B6N5W2YH3D3A1V0KE2Y');
    expect(instructor.instructorId).toBe('01J9QW7B6N5W2YH3D3A1V0KE30');
  });
});
