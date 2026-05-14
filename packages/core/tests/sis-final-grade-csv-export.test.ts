import { CourseFinalGrade } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { serializeSisFinalGradesAsCsv } from '../src/exports/sis-final-grade-csv-export.ts';

const now = new Date('2026-05-14T09:05:00.000Z');

describe('SIS final grade CSV export', () => {
  it('serializes calculated final grades with stable registrar identifiers', () => {
    const grade = CourseFinalGrade.parse({
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2S',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      score: 94,
      maxScore: 100,
      percent: 94,
      letterGrade: 'A',
      categoryRollups: [],
      computedAt: now,
    });

    expect(serializeSisFinalGradesAsCsv([grade])).toBe(
      [
        'tenant_id,course_id,student_id,score,max_score,percent,letter_grade,computed_at',
        '01J9QW7B6N5W2YH3D3A1V0KE2T,01J9QW7B6N5W2YH3D3A1V0KE2S,01J9QW7B6N5W2YH3D3A1V0KE2V,94,100,94,A,2026-05-14T09:05:00.000Z',
      ].join('\n'),
    );
  });
});
