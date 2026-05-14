import { QuizId, type QuizQuestion, QuizQuestionId, TenantId } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { exportQuizQuestionToQtiItem, parseQtiAssessmentItem } from '../src/qti/quiz-items.ts';
import type { AutoGradableQuizQuestion } from '../src/quizzes/auto-grading.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE85');
const quizId = QuizId.parse('01J9QW7B6N5W2YH3D3A1V0KE87');
const questionId = QuizQuestionId.parse('01J9QW7B6N5W2YH3D3A1V0KE88');
const now = new Date('2026-05-12T00:00:00.000Z');

const quizQuestion = (
  overrides: Partial<AutoGradableQuizQuestion> = {},
): AutoGradableQuizQuestion => ({
  id: questionId,
  tenantId,
  quizId,
  position: 0,
  questionType: 'multiple_choice',
  prompt: 'Which element connects evidence to a claim?',
  points: 2,
  choices: [
    { id: 'choice-a', text: 'Reasoning' },
    { id: 'choice-b', text: 'Evidence' },
    { id: 'choice-c', text: 'Claim' },
  ],
  answerKey: { kind: 'choice', correctChoiceIds: ['choice-a'] },
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('QTI quiz item mapping', () => {
  it('exports a multiple choice quiz question as a QTI 2.1 assessment item', () => {
    const item = exportQuizQuestionToQtiItem(quizQuestion());

    expect(item).toMatchObject({
      identifier: questionId,
      title: 'Which element connects evidence to a claim?',
    });
    expect(item.xml).toContain('<assessmentItem');
    expect(item.xml).toContain('<choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">');
    expect(item.xml).toContain('<correctResponse><value>choice-a</value></correctResponse>');
    expect(item.xml.indexOf('<outcomeDeclaration')).toBeLessThan(item.xml.indexOf('<itemBody>'));
  });

  it('imports a multiple choice QTI assessment item into quiz question input', () => {
    const imported = parseQtiAssessmentItem(`
      <assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" identifier="item-1" title="Evidence question">
        <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
          <correctResponse><value>choice-a</value></correctResponse>
        </responseDeclaration>
        <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
          <defaultValue><value>2</value></defaultValue>
        </outcomeDeclaration>
        <itemBody>
          <p>Which element connects evidence to a claim?</p>
          <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">
            <simpleChoice identifier="choice-a">Reasoning</simpleChoice>
            <simpleChoice identifier="choice-b">Evidence</simpleChoice>
          </choiceInteraction>
        </itemBody>
      </assessmentItem>
    `);

    expect(imported).toEqual({
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: [
        { id: 'choice-a', text: 'Reasoning' },
        { id: 'choice-b', text: 'Evidence' },
      ],
      answerKey: { kind: 'choice', correctChoiceIds: ['choice-a'] },
    });
  });

  it('round-trips numeric tolerance through an Open LMS QTI extension element', () => {
    const item = exportQuizQuestionToQtiItem(
      quizQuestion({
        questionType: 'numeric',
        choices: [],
        answerKey: { kind: 'numeric', value: 42, tolerance: 0.5 },
      }),
    );

    const imported = parseQtiAssessmentItem(item.xml);

    expect(imported).toMatchObject({
      questionType: 'numeric',
      answerKey: { kind: 'numeric', value: 42, tolerance: 0.5 },
    });
  });

  it('exports essay questions without answer keys as extended text interactions', () => {
    const question: AutoGradableQuizQuestion = {
      ...(quizQuestion({ questionType: 'essay', choices: [], answerKey: null }) as QuizQuestion),
      answerKey: null,
    };

    const item = exportQuizQuestionToQtiItem(question);

    expect(item.xml).toContain('<extendedTextInteraction responseIdentifier="RESPONSE"');
    expect(item.xml).not.toContain('<correctResponse>');
  });
});
