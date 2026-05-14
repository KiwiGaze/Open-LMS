import { LearningObjective, PublishedFeedback, Rubric } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  computeLearningObjectiveMasteryStatus,
  projectPublishedFeedbackToLearningObjectiveMastery,
} from '../src/courses/learning-objective-mastery.ts';

const now = new Date('2026-05-12T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

const rubric = Rubric.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE30',
  tenantId,
  title: 'Evidence rubric',
  version: 1,
  sourceTemplateId: null,
  criteria: [
    {
      id: 'criterion-evidence',
      label: 'Evidence',
      description: 'Uses evidence and explains why it matters.',
      evidenceRequired: true,
      learningObjectiveIds: [learningObjectiveId],
      levels: [
        { id: 'developing', label: 'Developing', description: 'Some evidence.', points: 2 },
        { id: 'strong', label: 'Strong', description: 'Clear evidence.', points: 4 },
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
});

const publishedFeedback = PublishedFeedback.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE31',
  tenantId,
  submissionId,
  source: 'ai_assisted',
  humanReviewId: null,
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Explain how this evidence supports your claim.',
      teacherNote: null,
      evidence: ['Evidence appears here.'],
      suggestedLevelId: 'strong',
      suggestedScore: 3,
    },
  ],
  overallComment: 'Published feedback.',
  linkedGradeId: null,
  version: 1,
  publishedAt: now,
});

describe('computeLearningObjectiveMasteryStatus', () => {
  it('returns not_assessed when scorePercent is null', () => {
    expect(computeLearningObjectiveMasteryStatus(null, 80)).toBe('not_assessed');
  });

  it('returns mastered when score equals the threshold', () => {
    expect(computeLearningObjectiveMasteryStatus(80, 80)).toBe('mastered');
  });

  it('returns mastered when score exceeds the threshold', () => {
    expect(computeLearningObjectiveMasteryStatus(95, 80)).toBe('mastered');
  });

  it('returns proficient when score is within 15 points below the threshold', () => {
    expect(computeLearningObjectiveMasteryStatus(70, 80)).toBe('proficient');
    expect(computeLearningObjectiveMasteryStatus(65, 80)).toBe('proficient');
  });

  it('returns developing when score is more than 15 points below the threshold', () => {
    expect(computeLearningObjectiveMasteryStatus(50, 80)).toBe('developing');
    expect(computeLearningObjectiveMasteryStatus(0, 80)).toBe('developing');
  });

  it('uses the conventional 80% threshold when no threshold is configured', () => {
    expect(computeLearningObjectiveMasteryStatus(85, null)).toBe('mastered');
    expect(computeLearningObjectiveMasteryStatus(70, null)).toBe('proficient');
    expect(computeLearningObjectiveMasteryStatus(50, null)).toBe('developing');
  });

  it('clamps the proficient band so a 10% threshold never drops below 0', () => {
    // threshold=10 → proficient band starts at max(10-15, 0) = 0
    expect(computeLearningObjectiveMasteryStatus(0, 10)).toBe('proficient');
    expect(computeLearningObjectiveMasteryStatus(10, 10)).toBe('mastered');
  });

  it('returns mastered when threshold is 0 and any score is recorded', () => {
    expect(computeLearningObjectiveMasteryStatus(0, 0)).toBe('mastered');
    expect(computeLearningObjectiveMasteryStatus(100, 0)).toBe('mastered');
  });

  it('treats a 100% threshold as mastered only on perfect scores', () => {
    expect(computeLearningObjectiveMasteryStatus(99, 100)).toBe('proficient');
    expect(computeLearningObjectiveMasteryStatus(100, 100)).toBe('mastered');
    expect(computeLearningObjectiveMasteryStatus(80, 100)).toBe('developing');
  });

  it('projects published rubric feedback into objective mastery updates', () => {
    const rows = projectPublishedFeedbackToLearningObjectiveMastery({
      publishedFeedback,
      rubric,
      learningObjectives: [
        LearningObjective.parse({
          id: learningObjectiveId,
          tenantId,
          courseId,
          code: 'LO-1',
          title: 'Explain evidence',
          description: null,
          status: 'active',
          position: 0,
          masteryThresholdPercent: 75,
          createdAt: now,
          updatedAt: now,
        }),
      ],
      courseId,
      studentId,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        tenantId,
        courseId,
        learningObjectiveId,
        studentId,
        status: 'mastered',
        score: 3,
        maxScore: 4,
        lastAssessedAt: now,
        evidenceCount: 1,
      }),
    );
  });
});
