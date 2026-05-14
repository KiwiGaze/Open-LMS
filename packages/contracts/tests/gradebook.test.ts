import { describe, expect, it } from 'vitest';
import { Grade, GradebookManualGrade, SisFinalGradeSubmission } from '../src/index.ts';

const now = new Date('2026-05-14T09:00:00.000Z');

describe('gradebook contracts', () => {
  it('accepts incomplete as a grade status for assignment and manual grades', () => {
    expect(
      Grade.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2G',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2S',
        score: 0,
        maxScore: 10,
        status: 'incomplete',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      }).status,
    ).toBe('incomplete');

    expect(
      GradebookManualGrade.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE2M',
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        gradebookManualItemId: '01J9QW7B6N5W2YH3D3A1V0KE2N',
        studentId: '01J9QW7B6N5W2YH3D3A1V0KE2A',
        score: 0,
        maxScore: 10,
        status: 'incomplete',
        source: 'manual',
        gradedAt: now,
        createdAt: now,
        updatedAt: now,
      }).status,
    ).toBe('incomplete');
  });

  it('models a queued SIS final grade submission without embedding grade rows', () => {
    const submission = SisFinalGradeSubmission.parse({
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE2S',
      integrationConnectionId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      storageFileId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      rowCount: 2,
      status: 'queued',
      submittedAt: now,
    });

    expect(submission.status).toBe('queued');
    expect(submission).not.toHaveProperty('grades');
    expect(submission).not.toHaveProperty('csv');
  });
});
