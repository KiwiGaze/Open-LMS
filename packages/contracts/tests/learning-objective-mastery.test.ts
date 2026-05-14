import { describe, expect, it } from 'vitest';
import { LearningObjectiveMastery } from '../src/course.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const masteryId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('learning objective mastery contracts', () => {
  it('accepts per-student mastery records for course learning objectives', () => {
    expect(
      LearningObjectiveMastery.parse({
        id: masteryId,
        tenantId,
        courseId,
        learningObjectiveId: objectiveId,
        studentId,
        status: 'proficient',
        score: 8,
        maxScore: 10,
        lastAssessedAt: now,
        evidenceCount: 2,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      courseId,
      learningObjectiveId: objectiveId,
      studentId,
      status: 'proficient',
      score: 8,
      maxScore: 10,
      evidenceCount: 2,
    });
  });

  it('rejects partial and impossible mastery scores', () => {
    const mastery = {
      id: masteryId,
      tenantId,
      courseId,
      learningObjectiveId: objectiveId,
      studentId,
      status: 'developing',
      score: 6,
      maxScore: 5,
      lastAssessedAt: now,
      evidenceCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    expect(() => LearningObjectiveMastery.parse(mastery)).toThrow(/score cannot exceed max score/i);
    expect(() =>
      LearningObjectiveMastery.parse({
        ...mastery,
        score: null,
        maxScore: 5,
      }),
    ).toThrow(/score and max score must both be set/i);
    expect(() =>
      LearningObjectiveMastery.parse({
        ...mastery,
        score: 5,
        maxScore: null,
      }),
    ).toThrow(/score and max score must both be set/i);
  });

  it('rejects non-finite and negative mastery score fields', () => {
    const mastery = {
      id: masteryId,
      tenantId,
      courseId,
      learningObjectiveId: objectiveId,
      studentId,
      status: 'developing',
      score: 5,
      maxScore: 10,
      lastAssessedAt: now,
      evidenceCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    expect(() =>
      LearningObjectiveMastery.parse({ ...mastery, score: Number.POSITIVE_INFINITY }),
    ).toThrow();
    expect(() =>
      LearningObjectiveMastery.parse({ ...mastery, maxScore: Number.POSITIVE_INFINITY }),
    ).toThrow();
    expect(() => LearningObjectiveMastery.parse({ ...mastery, score: Number.NaN })).toThrow();
    expect(() => LearningObjectiveMastery.parse({ ...mastery, score: -1 })).toThrow();
    expect(() => LearningObjectiveMastery.parse({ ...mastery, maxScore: 0 })).toThrow();
    expect(() => LearningObjectiveMastery.parse({ ...mastery, evidenceCount: -1 })).toThrow();
  });
});
