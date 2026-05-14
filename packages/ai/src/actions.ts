import { type AiAction, AiAction as AiActionSchema } from '@openlms/contracts';

export const aiActions = [
  {
    identifier: 'submission_precheck',
    productSurface: 'student_assignment_page',
    requiredContext: ['assignment', 'rubric', 'submission'],
    optionalContext: ['course_content'],
    outputContract: 'SubmissionPrecheckResult',
    riskLevel: 'medium',
    humanReviewRequired: false,
    allowedAudience: ['student', 'system'],
    scope: 'single',
  },
  {
    identifier: 'feedback_draft',
    productSurface: 'teacher_feedback_studio',
    requiredContext: ['assignment', 'rubric', 'submission'],
    optionalContext: ['course_content', 'previous_feedback'],
    outputContract: 'FeedbackDraftResult',
    riskLevel: 'medium',
    humanReviewRequired: true,
    allowedAudience: ['instructor', 'system'],
    scope: 'single',
  },
  {
    identifier: 'feedback_dialogue',
    productSurface: 'student_feedback_view',
    requiredContext: ['assignment', 'rubric', 'submission', 'published_feedback'],
    optionalContext: ['course_content', 'dialogue_history'],
    outputContract: 'FeedbackDialogueMessage',
    riskLevel: 'medium',
    humanReviewRequired: false,
    allowedAudience: ['student', 'instructor', 'system'],
    scope: 'single',
  },
  {
    identifier: 'assignment_trend_card',
    productSurface: 'teacher_assignment_trends',
    requiredContext: ['assignment', 'rubric', 'submissions'],
    optionalContext: ['course_content'],
    outputContract: 'AssignmentTrendCardResult',
    riskLevel: 'medium',
    humanReviewRequired: true,
    allowedAudience: ['instructor', 'admin', 'system'],
    scope: 'batch',
  },
  {
    identifier: 'rubric_clarity_review',
    productSurface: 'teacher_rubric_studio',
    requiredContext: ['rubric'],
    optionalContext: ['assignment'],
    outputContract: 'RubricClarityReviewResult',
    riskLevel: 'low',
    humanReviewRequired: false,
    allowedAudience: ['instructor', 'system'],
    scope: 'batch',
  },
  {
    identifier: 'page_explanation',
    productSurface: 'student_course_page',
    requiredContext: ['course_page'],
    optionalContext: ['course_content', 'assignment'],
    outputContract: 'PageExplanationResult',
    riskLevel: 'low',
    humanReviewRequired: false,
    allowedAudience: ['student', 'system'],
    scope: 'single',
  },
] satisfies AiAction[];

export const futureAiActions = [
  {
    identifier: 'cohort_live_review',
    productSurface: 'teacher_live_cohort_board',
    requiredContext: ['assignment', 'rubric', 'draft_signals'],
    optionalContext: ['course_content', 'precheck_history'],
    outputContract: 'CohortLiveReviewSignal',
    riskLevel: 'medium',
    humanReviewRequired: true,
    allowedAudience: ['instructor', 'admin', 'system'],
    scope: 'cohort',
  },
  {
    identifier: 'targeted_intervention',
    productSurface: 'teacher_targeted_nudge_composer',
    requiredContext: ['assignment', 'rubric', 'cohort_signal'],
    optionalContext: ['course_content', 'teacher_message'],
    outputContract: 'TargetedInterventionDraft',
    riskLevel: 'medium',
    humanReviewRequired: true,
    allowedAudience: ['instructor', 'system'],
    scope: 'cohort',
  },
  {
    identifier: 'live_draft_signal',
    productSurface: 'student_submission_editor',
    requiredContext: ['assignment', 'rubric', 'draft'],
    optionalContext: ['course_content', 'learning_objectives'],
    outputContract: 'LiveDraftSignal',
    riskLevel: 'medium',
    humanReviewRequired: false,
    allowedAudience: ['student', 'system'],
    scope: 'real_time_loop',
  },
] satisfies AiAction[];

export const getAiAction = (identifier: string): AiAction => {
  const action = [...aiActions, ...futureAiActions].find(
    (candidate) => candidate.identifier === identifier,
  );

  if (!action) {
    throw new Error(`AI action "${identifier}" is not registered. Check the action identifier.`);
  }

  return AiActionSchema.parse(action);
};
