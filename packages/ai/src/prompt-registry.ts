import { z } from 'zod';
import { getAiAction } from './actions.ts';

export const AiPromptStatus = z.enum(['draft', 'active', 'deprecated', 'archived']);
export type AiPromptStatus = z.infer<typeof AiPromptStatus>;

export const AiPrompt = z
  .object({
    identifier: z.string().min(1),
    version: z.string().min(1),
    actionIdentifier: z.string().min(1),
    outputContract: z.string().min(1),
    intendedAudience: z.array(z.enum(['student', 'instructor', 'admin', 'system'])).min(1),
    supportedModelFamilies: z.array(z.string().min(1)).min(1),
    evaluationDataset: z.string().min(1),
    owner: z.string().min(1),
    status: AiPromptStatus,
    changeLog: z.string().min(1),
    instructions: z.string().min(1),
  })
  .strict();
export type AiPrompt = z.infer<typeof AiPrompt>;

export const promptRegistry = [
  {
    identifier: 'submission_precheck.default',
    version: '2026-05-10.1',
    actionIdentifier: 'submission_precheck',
    outputContract: 'SubmissionPrecheckResult',
    intendedAudience: ['student', 'system'],
    supportedModelFamilies: ['instruction-following-text'],
    evaluationDataset: 'submission_precheck.regression.v1',
    owner: 'open-lms-ai',
    status: 'active',
    changeLog: 'Initial rubric-aware student precheck prompt.',
    instructions:
      'Provide formative pre-submission feedback grounded in the assignment, rubric, and submission evidence. Do not predict an official grade or rewrite the student work.',
  },
  {
    identifier: 'feedback_draft.default',
    version: '2026-05-10.1',
    actionIdentifier: 'feedback_draft',
    outputContract: 'FeedbackDraftResult',
    intendedAudience: ['instructor', 'system'],
    supportedModelFamilies: ['strong-reasoning-text'],
    evaluationDataset: 'feedback_draft.regression.v1',
    owner: 'open-lms-ai',
    status: 'active',
    changeLog: 'Initial instructor feedback draft prompt.',
    instructions:
      'Generate criterion-level instructor feedback with submission evidence, teacher-facing notes, and student-facing comments. Do not publish feedback or make official grade claims.',
  },
  {
    identifier: 'feedback_dialogue.default',
    version: '2026-05-12.1',
    actionIdentifier: 'feedback_dialogue',
    outputContract: 'FeedbackDialogueMessage',
    intendedAudience: ['student', 'instructor', 'system'],
    supportedModelFamilies: ['instruction-following-text'],
    evaluationDataset: 'feedback_dialogue.regression.v1',
    owner: 'open-lms-ai',
    status: 'active',
    changeLog: 'Initial student feedback dialogue prompt.',
    instructions:
      'Answer follow-up questions about already-published feedback using the submission, rubric, published comments, and dialogue history. Explain the feedback and suggest practice steps without changing the official grade or published feedback.',
  },
  {
    identifier: 'assignment_trend_card.default',
    version: '2026-05-10.1',
    actionIdentifier: 'assignment_trend_card',
    outputContract: 'AssignmentTrendCardResult',
    intendedAudience: ['instructor', 'admin', 'system'],
    supportedModelFamilies: ['aggregation-reasoning-text'],
    evaluationDataset: 'assignment_trend_card.regression.v1',
    owner: 'open-lms-ai',
    status: 'active',
    changeLog: 'Initial assignment trend card prompt.',
    instructions:
      'Generate cautious assignment-level trend hypotheses from aggregate evidence. Include limitations, cohort participation, and a concrete teaching action.',
  },
  {
    identifier: 'rubric_clarity_review.default',
    version: '2026-05-10.1',
    actionIdentifier: 'rubric_clarity_review',
    outputContract: 'RubricClarityReviewResult',
    intendedAudience: ['instructor', 'system'],
    supportedModelFamilies: ['instruction-following-text'],
    evaluationDataset: 'rubric_clarity_review.regression.v1',
    owner: 'open-lms-ai',
    status: 'active',
    changeLog: 'Initial rubric clarity review prompt.',
    instructions:
      'Review rubric criteria for vague, conflicting, or hard-to-evaluate language. Suggest concrete edits without changing instructor intent.',
  },
  {
    identifier: 'page_explanation.default',
    version: '2026-05-10.1',
    actionIdentifier: 'page_explanation',
    outputContract: 'PageExplanationResult',
    intendedAudience: ['student', 'system'],
    supportedModelFamilies: ['instruction-following-text'],
    evaluationDataset: 'page_explanation.regression.v1',
    owner: 'open-lms-ai',
    status: 'active',
    changeLog: 'Initial course page explanation prompt.',
    instructions:
      'Explain the current course page using only student-visible context. Encourage learning, cite source resources, and avoid solving active assessments directly.',
  },
] satisfies AiPrompt[];

export const getActivePromptForAction = (actionIdentifier: string): AiPrompt => {
  const action = getAiAction(actionIdentifier);
  const prompt = promptRegistry.find(
    (candidate) =>
      candidate.actionIdentifier === action.identifier && candidate.status === 'active',
  );

  if (!prompt) {
    throw new Error(`No active prompt is registered for AI action "${action.identifier}".`);
  }

  if (prompt.outputContract !== action.outputContract) {
    throw new Error(
      `Active prompt "${prompt.identifier}" output contract does not match action "${action.identifier}".`,
    );
  }

  return AiPrompt.parse(prompt);
};
