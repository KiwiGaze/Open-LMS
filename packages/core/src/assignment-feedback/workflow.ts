import {
  AiFeedbackDraft,
  type AiFeedbackDraft as AiFeedbackDraftContract,
  AiFeedbackDraftId,
  type Assignment,
  type CriterionFeedback,
  type Draft,
  type FeedbackDraftResult,
  CourseGroupId,
  GradeId,
  type HumanReview,
  PublishedFeedback,
  type PublishedFeedback as PublishedFeedbackContract,
  PublishedFeedbackId,
  Submission,
  type Submission as SubmissionContract,
  SubmissionId,
} from '@openlms/contracts';
import { ulid } from 'ulid';
import type { AiGenerationMetadata } from '../ai-logs/generation-result.ts';

export type CreateSubmissionFromDraftInput = {
  assignment: Assignment;
  draft: Draft;
  previousSubmissions: SubmissionContract[];
  groupId?: string | null;
  now: Date;
};

export const createSubmissionFromDraft = (
  input: CreateSubmissionFromDraftInput,
): SubmissionContract => {
  if (input.assignment.status !== 'published') {
    throw new Error('Assignment must be published before a student can submit work.');
  }

  if (input.assignment.tenantId !== input.draft.tenantId) {
    throw new Error('Draft tenant does not match assignment tenant.');
  }

  if (input.assignment.id !== input.draft.assignmentId) {
    throw new Error('Draft assignment does not match the target assignment.');
  }

  if (input.previousSubmissions.length > 0 && !input.assignment.allowResubmission) {
    throw new Error('This assignment does not allow resubmission.');
  }

  const version =
    input.previousSubmissions.reduce(
      (highestVersion, submission) => Math.max(highestVersion, submission.version),
      0,
    ) + 1;
  const status =
    input.assignment.dueAt && input.now.getTime() > input.assignment.dueAt.getTime()
      ? 'late'
      : 'submitted';

  return Submission.parse({
    id: SubmissionId.parse(ulid()),
    tenantId: input.draft.tenantId,
    assignmentId: input.draft.assignmentId,
    studentId: input.draft.studentId,
    groupId: input.groupId ? CourseGroupId.parse(input.groupId) : null,
    sourceDraftId: input.draft.id,
    version,
    status,
    contentSnapshot: input.draft.blocks,
    submittedAt: input.now,
    createdAt: input.now,
  });
};

export type RecordAiFeedbackDraftInput = {
  submission: SubmissionContract;
  contextPackageId: string;
  generationMetadata: AiGenerationMetadata;
  idempotencyKey: string;
  output: FeedbackDraftResult;
  now: Date;
};

export const recordAiFeedbackDraft = (input: RecordAiFeedbackDraftInput): AiFeedbackDraftContract =>
  AiFeedbackDraft.parse({
    id: AiFeedbackDraftId.parse(ulid()),
    tenantId: input.submission.tenantId,
    submissionId: input.submission.id,
    contextPackageId: input.contextPackageId,
    aiGenerationLogId: input.generationMetadata.aiGenerationLogId,
    promptIdentifier: input.generationMetadata.promptIdentifier,
    promptVersion: input.generationMetadata.promptVersion,
    providerType: input.generationMetadata.providerType,
    model: input.generationMetadata.model,
    idempotencyKey: input.idempotencyKey,
    status: 'generated',
    criterionFeedback: input.output.criterionFeedback,
    overallComment: input.output.overallComment,
    createdAt: input.now,
  });

export type PublishFeedbackFromReviewInput = {
  feedbackDraft: AiFeedbackDraftContract;
  review: HumanReview;
  previousPublishedFeedback: PublishedFeedbackContract[];
  now: Date;
};

export const publishFeedbackFromReview = (
  input: PublishFeedbackFromReviewInput,
): PublishedFeedbackContract => {
  if (input.feedbackDraft.tenantId !== input.review.tenantId) {
    throw new Error('Review tenant does not match feedback draft tenant.');
  }

  if (input.feedbackDraft.id !== input.review.aiFeedbackDraftId) {
    throw new Error('Review does not belong to the feedback draft.');
  }

  if (input.review.decision !== 'accept' && input.review.decision !== 'edit') {
    throw new Error('Only accept or edit review decisions can publish AI-assisted feedback.');
  }

  const criterionFeedback =
    input.review.decision === 'edit'
      ? input.review.editedCriterionFeedback
      : input.feedbackDraft.criterionFeedback;
  const overallComment =
    input.review.decision === 'edit'
      ? input.review.editedOverallComment
      : input.feedbackDraft.overallComment;
  const version =
    input.previousPublishedFeedback.reduce(
      (highestVersion, feedback) => Math.max(highestVersion, feedback.version),
      0,
    ) + 1;

  return PublishedFeedback.parse({
    id: PublishedFeedbackId.parse(ulid()),
    tenantId: input.feedbackDraft.tenantId,
    submissionId: input.feedbackDraft.submissionId,
    source: 'ai_assisted',
    humanReviewId: input.review.id,
    criterionFeedback,
    overallComment,
    linkedGradeId: null,
    version,
    publishedAt: input.now,
  });
};

export type PublishManualFeedbackInput = {
  submission: SubmissionContract;
  criterionFeedback: CriterionFeedback[];
  overallComment: string | null;
  linkedGradeId: string | null;
  previousPublishedFeedback: PublishedFeedbackContract[];
  now: Date;
};

export const publishManualFeedback = (
  input: PublishManualFeedbackInput,
): PublishedFeedbackContract => {
  const version =
    input.previousPublishedFeedback.reduce(
      (highestVersion, feedback) => Math.max(highestVersion, feedback.version),
      0,
    ) + 1;

  return PublishedFeedback.parse({
    id: PublishedFeedbackId.parse(ulid()),
    tenantId: input.submission.tenantId,
    submissionId: input.submission.id,
    source: 'manual',
    humanReviewId: null,
    criterionFeedback: input.criterionFeedback,
    overallComment: input.overallComment,
    linkedGradeId: input.linkedGradeId ? GradeId.parse(input.linkedGradeId) : null,
    version,
    publishedAt: input.now,
  });
};
