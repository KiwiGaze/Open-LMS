import { describe, expect, it } from 'vitest';
import { CompletionProgress, CompletionRequirement } from '../src/completion.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const requirementId = '01J9QW7B6N5W2YH3D3A1V0KE4J';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('completion contracts', () => {
  it('accepts course completion requirements', () => {
    expect(
      CompletionRequirement.parse({
        id: requirementId,
        tenantId,
        courseId,
        moduleId: null,
        title: 'Submit the evidence essay',
        description: 'Students must submit the main writing assignment.',
        requirementType: 'submit_assignment',
        targetType: 'assignment',
        targetId: '01J9QW7B6N5W2YH3D3A1V0KE36',
        minScorePercent: null,
        status: 'active',
        required: true,
        position: 0,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      id: requirementId,
      requirementType: 'submit_assignment',
      targetType: 'assignment',
      required: true,
    });
  });

  it('accepts module-scoped quiz completion thresholds', () => {
    expect(
      CompletionRequirement.parse({
        id: requirementId,
        tenantId,
        courseId,
        moduleId,
        title: 'Pass the evidence quiz',
        description: null,
        requirementType: 'pass_quiz',
        targetType: 'quiz',
        targetId: '01J9QW7B6N5W2YH3D3A1V0KE43',
        minScorePercent: 70,
        status: 'active',
        required: true,
        position: 1,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      moduleId,
      requirementType: 'pass_quiz',
      targetType: 'quiz',
      minScorePercent: 70,
    });
  });

  it('rejects min score thresholds outside pass quiz requirements', () => {
    expect(() =>
      CompletionRequirement.parse({
        id: requirementId,
        tenantId,
        courseId,
        moduleId: null,
        title: 'Submit the evidence essay',
        description: null,
        requirementType: 'submit_assignment',
        targetType: 'assignment',
        targetId: '01J9QW7B6N5W2YH3D3A1V0KE36',
        minScorePercent: 70,
        status: 'active',
        required: true,
        position: 0,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('accepts per-student completion progress', () => {
    expect(
      CompletionProgress.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE4K',
        tenantId,
        requirementId,
        studentId,
        status: 'completed',
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      requirementId,
      studentId,
      status: 'completed',
      completedAt: now,
    });
  });
});
