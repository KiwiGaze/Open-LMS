import { describe, expect, it } from 'vitest';
import { aiActions } from '../src/actions.ts';
import { getActivePromptForAction, promptRegistry } from '../src/prompt-registry.ts';

describe('prompt registry', () => {
  it('provides an active versioned prompt for every registered Phase 1 action', () => {
    const promptActions = promptRegistry
      .filter((prompt) => prompt.status === 'active')
      .map((prompt) => prompt.actionIdentifier);

    expect(promptActions).toEqual(aiActions.map((action) => action.identifier));
  });

  it('returns prompt metadata needed for audit and evaluation', () => {
    const prompt = getActivePromptForAction('feedback_draft');

    expect(prompt.identifier).toBe('feedback_draft.default');
    expect(prompt.version).toBe('2026-05-10.1');
    expect(prompt.outputContract).toBe('FeedbackDraftResult');
    expect(prompt.evaluationDataset).toBe('feedback_draft.regression.v1');
    expect(prompt.instructions).toContain('criterion-level');
  });
});
