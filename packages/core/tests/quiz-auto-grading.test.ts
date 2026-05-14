import { QuizAttemptResponse, QuizQuestion } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import type { AutoGradableQuizQuestion } from '../src/quizzes/auto-grading.ts';
import {
  gradeQuizAttemptResponses,
  gradeQuizAttemptResponsesWithManualGrades,
} from '../src/quizzes/auto-grading.ts';

const baseQuestion = {
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  quizId: '01J9QW7B6N5W2YH3D3A1V0KE43',
  position: 0,
  prompt: 'Question prompt',
  points: 2,
  choices: [],
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
};

const responseBase = {
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  quizId: '01J9QW7B6N5W2YH3D3A1V0KE43',
  attemptId: '01J9QW7B6N5W2YH3D3A1V0KE5E',
  createdAt: new Date('2026-05-10T00:00:00.000Z'),
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
};

const choiceQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE44';
const textQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE45';
const numericQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE46';
const matchingQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE47';

describe('gradeQuizAttemptResponses', () => {
  it('grades choice, text, numeric, and matching questions deterministically', () => {
    const questions: AutoGradableQuizQuestion[] = [
      {
        ...QuizQuestion.parse({
          ...baseQuestion,
          id: choiceQuestionId,
          questionType: 'multiple_choice' as const,
          points: 2,
        }),
        answerKey: { kind: 'choice' as const, correctChoiceIds: ['b', 'c'] },
      },
      {
        ...QuizQuestion.parse({
          ...baseQuestion,
          id: textQuestionId,
          questionType: 'short_answer' as const,
          points: 1,
        }),
        answerKey: { kind: 'text' as const, acceptedAnswers: ['Warrant'], caseSensitive: false },
      },
      {
        ...QuizQuestion.parse({
          ...baseQuestion,
          id: numericQuestionId,
          questionType: 'numeric' as const,
          points: 3,
        }),
        answerKey: { kind: 'numeric' as const, value: 3.14, tolerance: 0.01 },
      },
      {
        ...QuizQuestion.parse({
          ...baseQuestion,
          id: matchingQuestionId,
          questionType: 'matching' as const,
          points: 4,
        }),
        answerKey: {
          kind: 'pairs' as const,
          pairs: [
            { leftId: 'claim', rightId: 'main-point' },
            { leftId: 'evidence', rightId: 'support' },
          ],
        },
      },
    ];

    const responses = [
      QuizAttemptResponse.parse({
        ...responseBase,
        id: '01J9QW7B6N5W2YH3D3A1V0KE5F',
        questionId: choiceQuestionId,
        answer: { kind: 'choice' as const, selectedChoiceIds: ['c', 'b'] },
      }),
      QuizAttemptResponse.parse({
        ...responseBase,
        id: '01J9QW7B6N5W2YH3D3A1V0KE5G',
        questionId: textQuestionId,
        answer: { kind: 'text' as const, text: ' warrant ' },
      }),
      QuizAttemptResponse.parse({
        ...responseBase,
        id: '01J9QW7B6N5W2YH3D3A1V0KE5H',
        questionId: numericQuestionId,
        answer: { kind: 'numeric' as const, value: 3.145 },
      }),
      QuizAttemptResponse.parse({
        ...responseBase,
        id: '01J9QW7B6N5W2YH3D3A1V0KE5K',
        questionId: matchingQuestionId,
        answer: {
          kind: 'pairs' as const,
          pairs: [
            { leftId: 'evidence', rightId: 'support' },
            { leftId: 'claim', rightId: 'main-point' },
          ],
        },
      }),
    ];

    expect(gradeQuizAttemptResponses({ questions, responses })).toEqual({
      status: 'graded',
      score: 10,
      maxScore: 10,
      pendingManualQuestionIds: [],
    });
  });

  it('leaves attempts submitted when any question requires manual grading', () => {
    const essayQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE48';

    expect(
      gradeQuizAttemptResponses({
        questions: [
          {
            ...QuizQuestion.parse({
              ...baseQuestion,
              id: essayQuestionId,
              questionType: 'essay',
            }),
            answerKey: null,
          },
        ],
        responses: [],
      }),
    ).toEqual({
      status: 'submitted',
      score: null,
      maxScore: 2,
      pendingManualQuestionIds: [essayQuestionId],
    });
  });

  it('leaves essay questions manual even if an answer key is present', () => {
    const essayQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE48';

    expect(
      gradeQuizAttemptResponses({
        questions: [
          {
            ...QuizQuestion.parse({
              ...baseQuestion,
              id: essayQuestionId,
              questionType: 'essay',
            }),
            answerKey: {
              kind: 'text',
              acceptedAnswers: ['one acceptable phrase'],
              caseSensitive: false,
            },
          },
        ],
        responses: [
          QuizAttemptResponse.parse({
            ...responseBase,
            id: '01J9QW7B6N5W2YH3D3A1V0KE5M',
            questionId: essayQuestionId,
            answer: { kind: 'text', text: 'one acceptable phrase' },
          }),
        ],
      }),
    ).toMatchObject({
      status: 'submitted',
      score: null,
      pendingManualQuestionIds: [essayQuestionId],
    });
  });

  it('scores unanswered autogradable questions as zero', () => {
    expect(
      gradeQuizAttemptResponses({
        questions: [
          {
            ...QuizQuestion.parse({
              ...baseQuestion,
              id: '01J9QW7B6N5W2YH3D3A1V0KE49',
              questionType: 'true_false',
            }),
            answerKey: { kind: 'choice', correctChoiceIds: ['true'] },
          },
        ],
        responses: [],
      }),
    ).toMatchObject({ status: 'graded', score: 0, maxScore: 2 });
  });
});

describe('gradeQuizAttemptResponsesWithManualGrades', () => {
  const essayQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE4A';

  const questions: AutoGradableQuizQuestion[] = [
    {
      ...QuizQuestion.parse({
        ...baseQuestion,
        id: choiceQuestionId,
        questionType: 'multiple_choice',
        points: 2,
      }),
      answerKey: { kind: 'choice', correctChoiceIds: ['b'] },
    },
    {
      ...QuizQuestion.parse({
        ...baseQuestion,
        id: essayQuestionId,
        questionType: 'essay',
        position: 1,
        points: 5,
      }),
      answerKey: null,
    },
  ];

  const responses = [
    QuizAttemptResponse.parse({
      ...responseBase,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5N',
      questionId: choiceQuestionId,
      answer: { kind: 'choice', selectedChoiceIds: ['b'] },
    }),
  ];

  it('combines automatic scores with manual scores for manually graded questions', () => {
    expect(
      gradeQuizAttemptResponsesWithManualGrades({
        questions,
        responses,
        manualGrades: [{ questionId: essayQuestionId, score: 4 }],
      }),
    ).toEqual({
      status: 'graded',
      score: 6,
      maxScore: 7,
      pendingManualQuestionIds: [],
    });
  });

  it('keeps attempts submitted until every manual question has a grade', () => {
    expect(
      gradeQuizAttemptResponsesWithManualGrades({
        questions,
        responses,
        manualGrades: [],
      }),
    ).toEqual({
      status: 'submitted',
      score: null,
      maxScore: 7,
      pendingManualQuestionIds: [essayQuestionId],
    });
  });
});
