import { describe, expect, it } from 'vitest';
import { parseStructuredAiOutput } from '../src/structured-output.ts';

describe('structured AI output parsing', () => {
  it('parses feedback draft output into the contract shape', () => {
    const parsed = parseStructuredAiOutput('feedback_draft', {
      criterionFeedback: [
        {
          criterionId: 'criterion-evidence',
          studentFacingComment: 'Explain how the quote supports the claim.',
          teacherNote: null,
          evidence: ['The essay quotes the article.'],
          suggestedLevelId: 'developing',
          suggestedScore: null,
        },
      ],
      overallComment: 'Good start.',
    });

    expect(parsed.outputContract).toBe('FeedbackDraftResult');
  });

  it('rejects unsupported structured output actions', () => {
    expect(() => parseStructuredAiOutput('final_auto_grade', {})).toThrow(/Unsupported/);
  });

  it('parses rubric clarity review output into the contract shape', () => {
    const parsed = parseStructuredAiOutput('rubric_clarity_review', {
      qualityScore: 0.8,
      summary: 'The rubric is mostly clear.',
      issues: [
        {
          criterionId: 'criterion-evidence',
          severity: 'low',
          message: 'The evidence criterion could define source quality more precisely.',
          suggestion: 'Add a descriptor for credible source selection.',
        },
      ],
    });

    expect(parsed.outputContract).toBe('RubricClarityReviewResult');
  });

  it('parses page explanation output into the contract shape', () => {
    const parsed = parseStructuredAiOutput('page_explanation', {
      answer: 'Photosynthesis stores light energy as chemical energy in glucose.',
      keyPoints: ['Chlorophyll absorbs light.', 'Carbon dioxide and water are reactants.'],
      citedResourceIds: ['01J9QW7B6N5W2YH3D3A1V0KE2W'],
      followUpQuestions: ['How does chlorophyll capture light?'],
    });

    expect(parsed.outputContract).toBe('PageExplanationResult');
  });

  it('rejects invalid feedback draft output', () => {
    expect(() =>
      parseStructuredAiOutput('feedback_draft', {
        criterionFeedback: [],
        overallComment: null,
      }),
    ).toThrow();
  });

  it('rejects formative outputs that make final grade claims', () => {
    expect(() =>
      parseStructuredAiOutput('submission_precheck', {
        summary: 'This will receive a final grade of A.',
        issues: [],
      }),
    ).toThrow(/official grade claims/i);
  });

  it('rejects feedback drafts with unsupported final score language', () => {
    expect(() =>
      parseStructuredAiOutput('feedback_draft', {
        criterionFeedback: [
          {
            criterionId: 'criterion-evidence',
            studentFacingComment: 'Your final score is 90 percent.',
            teacherNote: null,
            evidence: ['The essay quotes the article.'],
            suggestedLevelId: null,
            suggestedScore: null,
          },
        ],
        overallComment: null,
      }),
    ).toThrow(/official grade claims/i);
  });
});
