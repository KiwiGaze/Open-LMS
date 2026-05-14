import { describe, expect, it } from 'vitest';
import { aiActions, futureAiActions, getAiAction } from '../src/actions.ts';

describe('AI action registry', () => {
  it('registers the Phase 1 AI actions with scopes', () => {
    expect(aiActions.map((action) => action.identifier)).toEqual([
      'submission_precheck',
      'feedback_draft',
      'feedback_dialogue',
      'assignment_trend_card',
      'rubric_clarity_review',
      'page_explanation',
    ]);
    expect(getAiAction('feedback_draft').scope).toBe('single');
    expect(getAiAction('feedback_dialogue')).toEqual(
      expect.objectContaining({
        productSurface: 'student_feedback_view',
        humanReviewRequired: false,
        scope: 'single',
      }),
    );
    expect(getAiAction('assignment_trend_card').scope).toBe('batch');
  });

  it('declares Phase 2 cohort actions without activating prompts', () => {
    expect(futureAiActions.map((action) => action.identifier)).toEqual([
      'cohort_live_review',
      'targeted_intervention',
      'live_draft_signal',
    ]);
    expect(getAiAction('cohort_live_review').scope).toBe('cohort');
    expect(getAiAction('live_draft_signal').scope).toBe('real_time_loop');
  });

  it('rejects unknown actions', () => {
    expect(() => getAiAction('final_auto_grade')).toThrow(/not registered/);
  });
});
