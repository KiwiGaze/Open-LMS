import {
  AssignmentTrendCardResult,
  type AssignmentTrendCardResult as AssignmentTrendCardResultContract,
  FeedbackDraftResult,
  type FeedbackDraftResult as FeedbackDraftResultContract,
  PageExplanationResult,
  type PageExplanationResult as PageExplanationResultContract,
  RubricClarityReviewResult,
  type RubricClarityReviewResult as RubricClarityReviewResultContract,
  SubmissionPrecheckResult,
  type SubmissionPrecheckResult as SubmissionPrecheckResultContract,
} from '@openlms/contracts';
import { checkStructuredOutputGuardrails } from './guardrails.ts';

export type ParsedStructuredAiOutput =
  | {
      actionIdentifier: 'submission_precheck';
      outputContract: 'SubmissionPrecheckResult';
      value: SubmissionPrecheckResultContract;
    }
  | {
      actionIdentifier: 'feedback_draft';
      outputContract: 'FeedbackDraftResult';
      value: FeedbackDraftResultContract;
    }
  | {
      actionIdentifier: 'assignment_trend_card';
      outputContract: 'AssignmentTrendCardResult';
      value: AssignmentTrendCardResultContract;
    }
  | {
      actionIdentifier: 'rubric_clarity_review';
      outputContract: 'RubricClarityReviewResult';
      value: RubricClarityReviewResultContract;
    }
  | {
      actionIdentifier: 'page_explanation';
      outputContract: 'PageExplanationResult';
      value: PageExplanationResultContract;
    };

export const parseStructuredAiOutput = (
  actionIdentifier: string,
  value: unknown,
): ParsedStructuredAiOutput => {
  if (actionIdentifier === 'submission_precheck') {
    const parsedValue = SubmissionPrecheckResult.parse(value);
    const guardrails = checkStructuredOutputGuardrails(actionIdentifier, parsedValue);
    if (!guardrails.allowed) {
      throw new Error(guardrails.reason);
    }

    return {
      actionIdentifier,
      outputContract: 'SubmissionPrecheckResult',
      value: parsedValue,
    };
  }

  if (actionIdentifier === 'feedback_draft') {
    const parsedValue = FeedbackDraftResult.parse(value);
    const guardrails = checkStructuredOutputGuardrails(actionIdentifier, parsedValue);
    if (!guardrails.allowed) {
      throw new Error(guardrails.reason);
    }

    return {
      actionIdentifier,
      outputContract: 'FeedbackDraftResult',
      value: parsedValue,
    };
  }

  if (actionIdentifier === 'assignment_trend_card') {
    return {
      actionIdentifier,
      outputContract: 'AssignmentTrendCardResult',
      value: AssignmentTrendCardResult.parse(value),
    };
  }

  if (actionIdentifier === 'rubric_clarity_review') {
    return {
      actionIdentifier,
      outputContract: 'RubricClarityReviewResult',
      value: RubricClarityReviewResult.parse(value),
    };
  }

  if (actionIdentifier === 'page_explanation') {
    return {
      actionIdentifier,
      outputContract: 'PageExplanationResult',
      value: PageExplanationResult.parse(value),
    };
  }

  throw new Error(`Unsupported structured AI output action "${actionIdentifier}".`);
};
