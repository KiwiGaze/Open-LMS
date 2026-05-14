import {
  AiFeedbackDraft,
  Assignment,
  CourseGroupSetId,
  type CriterionFeedback,
  Draft,
  FeedbackDraftResult,
  Grade,
  HumanReview,
  Submission,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  createSubmissionFromDraft,
  publishFeedbackFromReview,
  publishManualFeedback,
  recordAiFeedbackDraft,
} from '../src/assignment-feedback/workflow.ts';

const now = new Date('2026-05-10T00:00:00.000Z');

const assignment = Assignment.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
  title: 'Evidence essay',
  instructions: 'Write an essay using textual evidence.',
  status: 'published',
  dueAt: new Date('2026-05-11T00:00:00.000Z'),
  allowResubmission: true,
  activeRubricId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
  aiSettings: {
    precheckEnabled: true,
    feedbackDraftEnabled: true,
    scoreSuggestionEnabled: false,
  },
  createdAt: now,
  updatedAt: now,
});

const draft = Draft.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
  tenantId: assignment.tenantId,
  assignmentId: assignment.id,
  studentId: '01J9QW7B6N5W2YH3D3A1V0KE30',
  blocks: [{ blockId: 'intro', text: 'Evidence appears here.' }],
  createdAt: now,
  updatedAt: now,
});

const feedbackOutput = FeedbackDraftResult.parse({
  criterionFeedback: [
    {
      criterionId: 'criterion-evidence',
      studentFacingComment: 'Explain how this evidence supports your claim.',
      teacherNote: 'Useful formative note.',
      evidence: ['Evidence appears here.'],
      suggestedLevelId: 'developing',
      suggestedScore: null,
    },
  ],
  overallComment: 'The submission has a clear direction.',
});

const generationMetadata = {
  aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE37',
  promptIdentifier: 'feedback_draft.default',
  promptVersion: '2026-05-10.1',
  providerType: 'openai_compatible',
  model: 'feedback-model',
};

const manualCriterionFeedback: CriterionFeedback[] = [
  {
    criterionId: 'criterion-evidence',
    studentFacingComment: 'Add reasoning after your quote.',
    teacherNote: null,
    evidence: ['Evidence appears here.'],
    suggestedLevelId: null,
    suggestedScore: null,
  },
];

describe('assignment feedback workflow', () => {
  it('creates an immutable submitted snapshot from a draft', () => {
    const submission = createSubmissionFromDraft({
      assignment,
      draft,
      previousSubmissions: [],
      now,
    });

    expect(submission.version).toBe(1);
    expect(submission.status).toBe('submitted');
    expect(submission.contentSnapshot).toEqual(draft.blocks);
  });

  it('records the resolved group on group assignment submissions', () => {
    const groupId = '01J9QW7B6N5W2YH3D3A1V0KE3G';
    const submission = createSubmissionFromDraft({
      assignment: {
        ...assignment,
        groupSubmissionEnabled: true,
        groupSetId: CourseGroupSetId.parse('01J9QW7B6N5W2YH3D3A1V0KE3H'),
      },
      draft,
      previousSubmissions: [
        Submission.parse({
          id: '01J9QW7B6N5W2YH3D3A1V0KE3J',
          tenantId: assignment.tenantId,
          assignmentId: assignment.id,
          studentId: '01J9QW7B6N5W2YH3D3A1V0KE3K',
          groupId,
          sourceDraftId: draft.id,
          version: 1,
          status: 'submitted',
          contentSnapshot: draft.blocks,
          submittedAt: now,
          createdAt: now,
        }),
      ],
      groupId,
      now,
    });

    expect(submission.groupId).toBe(groupId);
    expect(submission.studentId).toBe(draft.studentId);
    expect(submission.version).toBe(2);
  });

  it('rejects submissions for draft assignments', () => {
    expect(() =>
      createSubmissionFromDraft({
        assignment: { ...assignment, status: 'draft' },
        draft,
        previousSubmissions: [],
        now,
      }),
    ).toThrow(/published/);
  });

  it('records AI feedback drafts as generated suggestions', () => {
    const submission = Submission.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: assignment.tenantId,
      assignmentId: assignment.id,
      studentId: draft.studentId,
      sourceDraftId: draft.id,
      version: 1,
      status: 'submitted',
      contentSnapshot: draft.blocks,
      submittedAt: now,
      createdAt: now,
    });

    const feedbackDraft = recordAiFeedbackDraft({
      submission,
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      generationMetadata,
      idempotencyKey: 'feedback_draft:submission-1:context-1',
      output: feedbackOutput,
      now,
    });

    expect(feedbackDraft.status).toBe('generated');
    expect(feedbackDraft.criterionFeedback[0]?.teacherNote).toBe('Useful formative note.');
    expect(feedbackDraft.aiGenerationLogId).toBe(generationMetadata.aiGenerationLogId);
    expect(feedbackDraft.promptIdentifier).toBe(generationMetadata.promptIdentifier);
    expect(feedbackDraft.promptVersion).toBe(generationMetadata.promptVersion);
    expect(feedbackDraft.providerType).toBe(generationMetadata.providerType);
    expect(feedbackDraft.model).toBe(generationMetadata.model);
  });

  it('publishes AI-assisted feedback only from accept or edit review decisions', () => {
    const feedbackDraft = AiFeedbackDraft.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId: assignment.tenantId,
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      ...generationMetadata,
      idempotencyKey: 'feedback_draft:submission-1:context-1',
      status: 'generated',
      criterionFeedback: feedbackOutput.criterionFeedback,
      overallComment: feedbackOutput.overallComment,
      createdAt: now,
    });
    const review = HumanReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      tenantId: assignment.tenantId,
      aiFeedbackDraftId: feedbackDraft.id,
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      decision: 'edit',
      editedCriterionFeedback: [
        {
          ...feedbackOutput.criterionFeedback[0],
          studentFacingComment: 'Explain how this quote proves your claim.',
        },
      ],
      editedOverallComment: 'Teacher-approved final feedback.',
      reviewerNote: null,
      createdAt: now,
    });

    const published = publishFeedbackFromReview({
      feedbackDraft,
      review,
      previousPublishedFeedback: [],
      now,
    });

    expect(published.source).toBe('ai_assisted');
    expect(published.version).toBe(1);
    expect(published.criterionFeedback[0]?.studentFacingComment).toContain('proves');
  });

  it('publishes manual feedback without requiring an AI draft when AI is disabled', () => {
    const submission = Submission.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      tenantId: assignment.tenantId,
      assignmentId: assignment.id,
      studentId: draft.studentId,
      sourceDraftId: draft.id,
      version: 1,
      status: 'submitted',
      contentSnapshot: draft.blocks,
      submittedAt: now,
      createdAt: now,
    });
    const grade = Grade.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE36',
      tenantId: assignment.tenantId,
      submissionId: submission.id,
      score: 8,
      maxScore: 10,
      status: 'draft',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    });

    const published = publishManualFeedback({
      submission,
      criterionFeedback: manualCriterionFeedback,
      overallComment: 'Manual feedback ready for the student.',
      linkedGradeId: grade.id,
      previousPublishedFeedback: [],
      now,
    });

    expect(published.source).toBe('manual');
    expect(published.humanReviewId).toBeNull();
    expect(published.linkedGradeId).toBe(grade.id);
    expect(published.version).toBe(1);
  });

  it('does not publish rejected AI feedback', () => {
    const feedbackDraft = AiFeedbackDraft.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      tenantId: assignment.tenantId,
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE31',
      contextPackageId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      ...generationMetadata,
      idempotencyKey: 'feedback_draft:submission-1:context-1',
      status: 'generated',
      criterionFeedback: feedbackOutput.criterionFeedback,
      overallComment: feedbackOutput.overallComment,
      createdAt: now,
    });
    const review = HumanReview.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      tenantId: assignment.tenantId,
      aiFeedbackDraftId: feedbackDraft.id,
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      decision: 'reject',
      editedCriterionFeedback: [],
      editedOverallComment: null,
      reviewerNote: 'Feedback was too vague.',
      createdAt: now,
    });

    expect(() =>
      publishFeedbackFromReview({
        feedbackDraft,
        review,
        previousPublishedFeedback: [],
        now,
      }),
    ).toThrow(/accept or edit/);
  });
});
