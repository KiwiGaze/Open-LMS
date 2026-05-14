import { HumanReview } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { summarizeFeedbackDraftEvaluations } from '../src/evaluation.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const reviewIds = {
  accept: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  edit: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  reject: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  request_regeneration: '01J9QW7B6N5W2YH3D3A1V0KE2X',
};

const review = (decision: 'accept' | 'edit' | 'reject' | 'request_regeneration') =>
  HumanReview.parse({
    id: reviewIds[decision],
    tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
    aiFeedbackDraftId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
    reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE30',
    decision,
    editedCriterionFeedback: [],
    editedOverallComment: null,
    reviewerNote: null,
    createdAt: now,
  });

describe('AI evaluation metrics', () => {
  it('summarizes teacher feedback-draft review decisions', () => {
    const summary = summarizeFeedbackDraftEvaluations([
      review('accept'),
      review('accept'),
      review('edit'),
      review('reject'),
      review('request_regeneration'),
    ]);

    expect(summary.totalReviews).toBe(5);
    expect(summary.accepted).toBe(2);
    expect(summary.edited).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.regenerationRequested).toBe(1);
    expect(summary.acceptanceRate).toBe(0.4);
    expect(summary.lightEditOrAcceptRate).toBe(0.6);
  });

  it('returns zero rates when no reviews exist', () => {
    const summary = summarizeFeedbackDraftEvaluations([]);

    expect(summary.totalReviews).toBe(0);
    expect(summary.acceptanceRate).toBe(0);
    expect(summary.lightEditOrAcceptRate).toBe(0);
  });
});
