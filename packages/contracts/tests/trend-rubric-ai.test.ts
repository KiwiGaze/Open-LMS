import { describe, expect, it } from 'vitest';
import {
  AssignmentTrendCardResult,
  RubricClarityReviewResult,
  StoredAssignmentTrendCard,
  StoredRubricClarityReview,
} from '../src/index.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

describe('trend card and rubric clarity contracts', () => {
  it('models stored assignment trend cards as instructor-facing hypotheses', () => {
    const result = AssignmentTrendCardResult.parse({
      title: 'Evidence needs explanation',
      summary: 'Many submissions quote evidence without explaining relevance.',
      trendType: 'criterion_weakness',
      cohortSizeTotal: 24,
      cohortSizeConsenting: 20,
      signalQualityClass: 'partial',
      evidence: ['14 of 20 consenting submissions had criterion-evidence issues.'],
      suggestedTeachingAction: 'Review one example paragraph before the next revision.',
    });

    const stored = StoredAssignmentTrendCard.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      idempotencyKey: 'trend-job-1',
      result,
      createdAt: now,
    });

    expect(stored.result.trendType).toBe('criterion_weakness');
  });

  it('requires assignment trend cards to include aggregate evidence', () => {
    expect(() =>
      AssignmentTrendCardResult.parse({
        title: 'Evidence needs explanation',
        summary: 'Many submissions quote evidence without explaining relevance.',
        trendType: 'criterion_weakness',
        cohortSizeTotal: 24,
        cohortSizeConsenting: 20,
        signalQualityClass: 'partial',
        evidence: [],
        suggestedTeachingAction: 'Review one example paragraph before the next revision.',
      }),
    ).toThrow();
  });

  it('models stored rubric clarity reviews with quality scores and issues', () => {
    const result = RubricClarityReviewResult.parse({
      qualityScore: 0.72,
      summary: 'Clarify what counts as strong evidence.',
      issues: [
        {
          criterionId: 'criterion-evidence',
          severity: 'medium',
          message: 'The criterion does not distinguish evidence quality from quantity.',
          suggestion: 'Add one descriptor about relevance and source credibility.',
        },
      ],
    });

    const stored = StoredRubricClarityReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      rubricId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      idempotencyKey: 'rubric-clarity-job-1',
      result,
      createdAt: now,
    });

    expect(stored.result.issues[0]?.severity).toBe('medium');
  });
});
