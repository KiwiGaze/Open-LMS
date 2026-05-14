import {
  AiFeedbackDraft,
  FeedbackDraftResult,
  HumanReview,
  PublishedFeedback,
  Submission,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  completeAiFeedbackDraftOnce,
  publishReviewedFeedbackOnce,
} from '../src/assignment-feedback/idempotency.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const submission = Submission.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  tenantId,
  assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  studentId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  version: 1,
  status: 'submitted',
  contentSnapshot: [{ blockId: 'intro', text: 'Evidence appears here.' }],
  submittedAt: now,
  createdAt: now,
});
const output = FeedbackDraftResult.parse({
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Explain why the evidence supports the claim.',
      teacherNote: null,
      evidence: ['Evidence appears here.'],
      suggestedLevelId: 'developing',
      suggestedScore: null,
    },
  ],
  overallComment: 'Good start.',
});
const generationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE35',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'feedback-model',
};

describe('idempotent assignment feedback workflows', () => {
  it('returns an existing AI feedback draft for duplicate callback idempotency keys', async () => {
    const existing = AiFeedbackDraft.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      tenantId,
      submissionId: submission.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      ...generationMetadata,
      idempotencyKey: 'job-1',
      status: 'generated',
      criterionFeedback: output.criterionFeedback,
      overallComment: output.overallComment,
      createdAt: now,
    });
    const saved: unknown[] = [];

    const result = await completeAiFeedbackDraftOnce({
      submission,
      contextPackageId: existing.contextPackageId,
      generationMetadata,
      idempotencyKey: existing.idempotencyKey,
      output,
      now,
      findExisting: async () => existing,
      save: async (draft) => {
        saved.push(draft);
        return draft;
      },
    });

    expect(result.feedbackDraft.id).toBe(existing.id);
    expect(result.created).toBe(false);
    expect(saved).toHaveLength(0);
  });

  it('creates an AI feedback draft once when no idempotent match exists', async () => {
    const saved: unknown[] = [];

    const result = await completeAiFeedbackDraftOnce({
      submission,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      generationMetadata,
      idempotencyKey: 'job-2',
      output,
      now,
      findExisting: async () => null,
      save: async (draft) => {
        saved.push(draft);
        return draft;
      },
    });

    expect(result.feedbackDraft.idempotencyKey).toBe('job-2');
    expect(result.created).toBe(true);
    expect(saved).toHaveLength(1);
  });

  it('returns existing published feedback when the same review is replayed', async () => {
    const draft = AiFeedbackDraft.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE30',
      tenantId,
      submissionId: submission.id,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      ...generationMetadata,
      idempotencyKey: 'job-1',
      status: 'generated',
      criterionFeedback: output.criterionFeedback,
      overallComment: output.overallComment,
      createdAt: now,
    });
    const review = HumanReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      tenantId,
      aiFeedbackDraftId: draft.id,
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      decision: 'accept',
      editedCriterionFeedback: [],
      editedOverallComment: null,
      reviewerNote: null,
      createdAt: now,
    });
    const existing = PublishedFeedback.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      tenantId,
      submissionId: submission.id,
      source: 'ai_assisted',
      humanReviewId: review.id,
      criterionFeedback: output.criterionFeedback,
      overallComment: output.overallComment,
      linkedGradeId: null,
      version: 1,
      publishedAt: now,
    });
    const saved: unknown[] = [];

    const result = await publishReviewedFeedbackOnce({
      feedbackDraft: draft,
      review,
      previousPublishedFeedback: [],
      now,
      findExistingByReviewId: async () => existing,
      save: async (feedback) => {
        saved.push(feedback);
        return feedback;
      },
    });

    expect(result.publishedFeedback.id).toBe(existing.id);
    expect(result.created).toBe(false);
    expect(saved).toHaveLength(0);
  });
});
