import { z } from 'zod';
import {
  AiFeedbackDraftId,
  ContextPackageId,
  FeedbackDialogueId,
  FeedbackDialogueMessageId,
  GradeId,
  HumanReviewId,
  PublishedFeedbackId,
  SubmissionId,
  TenantId,
  UserId,
} from './ids.ts';

export const CriterionFeedback = z
  .object({
    criterionId: z.string().min(1),
    studentFacingComment: z.string().min(1),
    teacherNote: z.string().nullable(),
    evidence: z.array(z.string().min(1)),
    suggestedLevelId: z.string().min(1).nullable(),
    suggestedScore: z.number().nonnegative().nullable(),
  })
  .strict();
export type CriterionFeedback = z.infer<typeof CriterionFeedback>;

export const AiFeedbackDraftStatus = z.enum(['generated', 'reviewed', 'rejected', 'superseded']);
export type AiFeedbackDraftStatus = z.infer<typeof AiFeedbackDraftStatus>;

export const AiFeedbackDraft = z.object({
  id: AiFeedbackDraftId,
  tenantId: TenantId,
  submissionId: SubmissionId,
  contextPackageId: ContextPackageId,
  aiGenerationLogId: z.string().min(1),
  promptIdentifier: z.string().min(1),
  promptVersion: z.string().min(1),
  providerType: z.string().min(1),
  model: z.string().min(1),
  idempotencyKey: z.string().min(1),
  status: AiFeedbackDraftStatus,
  criterionFeedback: z.array(CriterionFeedback).min(1),
  overallComment: z.string().nullable(),
  createdAt: z.date(),
});
export type AiFeedbackDraft = z.infer<typeof AiFeedbackDraft>;

export const HumanReviewDecision = z.enum(['accept', 'edit', 'reject', 'request_regeneration']);
export type HumanReviewDecision = z.infer<typeof HumanReviewDecision>;

export const HumanReview = z.object({
  id: HumanReviewId,
  tenantId: TenantId,
  aiFeedbackDraftId: AiFeedbackDraftId,
  reviewerId: UserId,
  decision: HumanReviewDecision,
  editedCriterionFeedback: z.array(CriterionFeedback),
  editedOverallComment: z.string().nullable(),
  reviewerNote: z.string().nullable(),
  createdAt: z.date(),
});
export type HumanReview = z.infer<typeof HumanReview>;

export const PublishedFeedbackSource = z.enum([
  'manual',
  'ai_assisted',
  'imported',
  'peer_reviewed',
]);
export type PublishedFeedbackSource = z.infer<typeof PublishedFeedbackSource>;

export const PublishedFeedback = z.object({
  id: PublishedFeedbackId,
  tenantId: TenantId,
  submissionId: SubmissionId,
  source: PublishedFeedbackSource,
  humanReviewId: HumanReviewId.nullable(),
  criterionFeedback: z.array(CriterionFeedback),
  overallComment: z.string().nullable(),
  linkedGradeId: GradeId.nullable(),
  version: z.number().int().positive(),
  publishedAt: z.date(),
});
export type PublishedFeedback = z.infer<typeof PublishedFeedback>;

export const FeedbackDialogueStatus = z.enum(['open', 'closed']);
export type FeedbackDialogueStatus = z.infer<typeof FeedbackDialogueStatus>;

export const FeedbackDialogue = z
  .object({
    id: FeedbackDialogueId,
    tenantId: TenantId,
    publishedFeedbackId: PublishedFeedbackId,
    submissionId: SubmissionId,
    status: FeedbackDialogueStatus,
    openedById: UserId,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type FeedbackDialogue = z.infer<typeof FeedbackDialogue>;

export const FeedbackDialogueMessageAuthorRole = z.enum(['student', 'instructor', 'ai']);
export type FeedbackDialogueMessageAuthorRole = z.infer<typeof FeedbackDialogueMessageAuthorRole>;

export const FeedbackDialogueMessage = z
  .object({
    id: FeedbackDialogueMessageId,
    tenantId: TenantId,
    dialogueId: FeedbackDialogueId,
    authorRole: FeedbackDialogueMessageAuthorRole,
    authorId: UserId.nullable(),
    criterionId: z.string().min(1).nullable(),
    body: z.string().min(1).max(10_000),
    contextPackageId: ContextPackageId.nullable(),
    aiGenerationLogId: z.string().min(1).nullable(),
    createdAt: z.date(),
  })
  .strict()
  .superRefine((message, context) => {
    if (message.authorRole !== 'ai' && message.authorId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Student and instructor feedback dialogue messages require an author.',
        path: ['authorId'],
      });
    }

    if (message.authorRole === 'ai' && message.contextPackageId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AI feedback dialogue messages require the context package used to answer.',
        path: ['contextPackageId'],
      });
    }
  });
export type FeedbackDialogueMessage = z.infer<typeof FeedbackDialogueMessage>;

export const GradeStatus = z.enum([
  'draft',
  'published',
  'locked',
  'appealed',
  'revised',
  'incomplete',
]);
export type GradeStatus = z.infer<typeof GradeStatus>;

export const GradeSource = z.enum(['manual', 'imported', 'ai_assisted_draft_reviewed_by_human']);
export type GradeSource = z.infer<typeof GradeSource>;

export const Grade = z
  .object({
    id: GradeId,
    tenantId: TenantId,
    submissionId: SubmissionId,
    score: z.number().nonnegative(),
    maxScore: z.number().positive(),
    status: GradeStatus,
    source: GradeSource,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((grade, context) => {
    if (grade.score > grade.maxScore) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Grade score cannot exceed max score.',
        path: ['score'],
      });
    }
  });
export type Grade = z.infer<typeof Grade>;
