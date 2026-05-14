import { z } from 'zod';
import { CriterionFeedback } from './feedback.ts';
import {
  AssignmentId,
  AssignmentTrendCardId,
  ContextPackageId,
  CoursePageId,
  PageExplanationId,
  RubricClarityReviewId,
  RubricId,
  SubmissionId,
  SubmissionPrecheckId,
  TenantId,
} from './ids.ts';

export const SubmissionPrecheckIssue = z
  .object({
    criterionId: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high']),
    message: z.string().min(1),
    evidence: z.array(z.string().min(1)).min(1),
    suggestion: z.string().min(1),
  })
  .strict();
export type SubmissionPrecheckIssue = z.infer<typeof SubmissionPrecheckIssue>;

export const SubmissionPrecheckResult = z.object({
  summary: z.string().min(1),
  issues: z.array(SubmissionPrecheckIssue),
});
export type SubmissionPrecheckResult = z.infer<typeof SubmissionPrecheckResult>;

export const StoredSubmissionPrecheck = z.object({
  id: SubmissionPrecheckId,
  tenantId: TenantId,
  submissionId: SubmissionId,
  contextPackageId: ContextPackageId,
  idempotencyKey: z.string().min(1),
  result: SubmissionPrecheckResult,
  createdAt: z.date(),
});
export type StoredSubmissionPrecheck = z.infer<typeof StoredSubmissionPrecheck>;

export const FeedbackDraftResult = z.object({
  criterionFeedback: z.array(CriterionFeedback).min(1),
  overallComment: z.string().nullable(),
});
export type FeedbackDraftResult = z.infer<typeof FeedbackDraftResult>;

export const AssignmentTrendCardResult = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  trendType: z.enum([
    'common_misconception',
    'criterion_weakness',
    'improvement_signal',
    'rubric_confusion',
    'submission_pattern',
  ]),
  cohortSizeTotal: z.number().int().nonnegative(),
  cohortSizeConsenting: z.number().int().nonnegative(),
  signalQualityClass: z.enum(['representative', 'partial', 'insufficient_n']),
  evidence: z.array(z.string().min(1)).min(1),
  suggestedTeachingAction: z.string().min(1),
});
export type AssignmentTrendCardResult = z.infer<typeof AssignmentTrendCardResult>;

export const StoredAssignmentTrendCard = z.object({
  id: AssignmentTrendCardId,
  tenantId: TenantId,
  assignmentId: AssignmentId,
  contextPackageId: ContextPackageId,
  idempotencyKey: z.string().min(1),
  result: AssignmentTrendCardResult,
  createdAt: z.date(),
});
export type StoredAssignmentTrendCard = z.infer<typeof StoredAssignmentTrendCard>;

export const RubricClarityIssue = z
  .object({
    criterionId: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high']),
    message: z.string().min(1),
    suggestion: z.string().min(1),
  })
  .strict();
export type RubricClarityIssue = z.infer<typeof RubricClarityIssue>;

export const RubricClarityReviewResult = z.object({
  qualityScore: z.number().min(0).max(1),
  summary: z.string().min(1),
  issues: z.array(RubricClarityIssue),
});
export type RubricClarityReviewResult = z.infer<typeof RubricClarityReviewResult>;

export const StoredRubricClarityReview = z.object({
  id: RubricClarityReviewId,
  tenantId: TenantId,
  rubricId: RubricId,
  contextPackageId: ContextPackageId,
  idempotencyKey: z.string().min(1),
  result: RubricClarityReviewResult,
  createdAt: z.date(),
});
export type StoredRubricClarityReview = z.infer<typeof StoredRubricClarityReview>;

export const PageExplanationResult = z.object({
  answer: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
  citedResourceIds: z.array(z.string().min(1)).min(1),
  followUpQuestions: z.array(z.string().min(1)).min(1),
});
export type PageExplanationResult = z.infer<typeof PageExplanationResult>;

export const StoredPageExplanation = z.object({
  id: PageExplanationId,
  tenantId: TenantId,
  coursePageId: CoursePageId,
  contextPackageId: ContextPackageId,
  idempotencyKey: z.string().min(1),
  result: PageExplanationResult,
  createdAt: z.date(),
});
export type StoredPageExplanation = z.infer<typeof StoredPageExplanation>;
