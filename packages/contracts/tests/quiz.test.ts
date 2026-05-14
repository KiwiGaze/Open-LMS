import { describe, expect, it } from 'vitest';
import {
  QuestionBank,
  QuestionBankQuestion,
  Quiz,
  QuizAttempt,
  QuizAttemptProbe,
  QuizAttemptProbeResponse,
  QuizAttemptResponse,
  QuizQuestion,
  QuizQuestionAnswerKey,
} from '../src/quiz.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE43';
const quizQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE44';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE77';
const quizAttemptId = '01J9QW7B6N5W2YH3D3A1V0KE5E';
const quizAttemptResponseId = '01J9QW7B6N5W2YH3D3A1V0KE5F';
const quizAttemptProbeId = '01J9QW7B6N5W2YH3D3A1V0KE60';
const quizAttemptProbeResponseId = '01J9QW7B6N5W2YH3D3A1V0KE61';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE62';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('quiz contracts', () => {
  it('accepts course quizzes without exposing attempt data', () => {
    expect(
      Quiz.parse({
        id: quizId,
        tenantId,
        courseId,
        title: 'Evidence check',
        description: 'Check whether evidence is connected to the claim.',
        status: 'published',
        opensAt: now,
        closesAt: null,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        maxAttempts: 2,
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: quizId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Evidence check',
      description: 'Check whether evidence is connected to the claim.',
      status: 'published',
      opensAt: now,
      closesAt: null,
      timeLimitMinutes: 30,
      shuffleQuestions: false,
      maxAttempts: 2,
      gradingMethod: 'best',
      proctoringRequired: false,
      accessPasswordRequired: false,
      allowedIpRanges: [],
      createdAt: now,
      updatedAt: now,
    });
  });

  it('models quiz access controls without exposing password material', () => {
    expect(
      Quiz.parse({
        id: quizId,
        tenantId,
        courseId,
        title: 'Evidence check',
        description: 'Check whether evidence is connected to the claim.',
        status: 'published',
        opensAt: now,
        closesAt: null,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        maxAttempts: 2,
        accessPasswordRequired: true,
        allowedIpRanges: ['203.0.113.0/24', '198.51.100.10'],
        accessPasswordHash: 'scrypt:v1:secret',
        createdAt: now,
        updatedAt: now,
      }),
    ).toEqual({
      id: quizId,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Evidence check',
      description: 'Check whether evidence is connected to the claim.',
      status: 'published',
      opensAt: now,
      closesAt: null,
      timeLimitMinutes: 30,
      shuffleQuestions: false,
      maxAttempts: 2,
      gradingMethod: 'best',
      proctoringRequired: false,
      accessPasswordRequired: true,
      allowedIpRanges: ['203.0.113.0/24', '198.51.100.10'],
      createdAt: now,
      updatedAt: now,
    });
  });

  it('models quiz placement inside course modules', () => {
    expect(
      Quiz.parse({
        id: quizId,
        tenantId,
        courseId,
        moduleId,
        unitId,
        position: 1,
        title: 'Evidence check',
        description: 'Check whether evidence is connected to the claim.',
        status: 'published',
        opensAt: now,
        closesAt: null,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        maxAttempts: 2,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      moduleId,
      unitId,
      position: 1,
    });
  });

  it('requires unit quizzes to include their parent module', () => {
    expect(() =>
      Quiz.parse({
        id: quizId,
        tenantId,
        courseId,
        moduleId: null,
        unitId,
        position: 1,
        title: 'Evidence check',
        description: 'Check whether evidence is connected to the claim.',
        status: 'published',
        opensAt: now,
        closesAt: null,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        maxAttempts: 2,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow('Unit quizzes must include their parent module.');
  });

  it('accepts quiz questions without answer keys', () => {
    expect(
      QuizQuestion.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE44',
        tenantId,
        quizId,
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which sentence best connects the evidence to the claim?',
        points: 2,
        choices: [
          { id: 'a', text: 'It repeats the quote.' },
          { id: 'b', text: 'It explains why the quote matters.' },
        ],
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      id: '01J9QW7B6N5W2YH3D3A1V0KE44',
      questionType: 'multiple_choice',
      points: 2,
      choices: [
        { id: 'a', text: 'It repeats the quote.' },
        { id: 'b', text: 'It explains why the quote matters.' },
      ],
    });
  });

  it('accepts reusable course question banks', () => {
    expect(
      QuestionBank.parse({
        id: questionBankId,
        tenantId,
        courseId,
        title: 'Evidence reasoning bank',
        description: 'Reusable evidence and explanation prompts.',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({
      id: questionBankId,
      courseId,
      title: 'Evidence reasoning bank',
      status: 'active',
    });
  });

  it('accepts reusable question bank questions without answer keys', () => {
    const question = QuestionBankQuestion.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE78',
      tenantId,
      questionBankId,
      position: 0,
      questionType: 'essay',
      prompt: 'Explain why this quote supports the claim.',
      points: 3,
      choices: [],
      createdAt: now,
      updatedAt: now,
    });

    expect(question).toMatchObject({
      id: '01J9QW7B6N5W2YH3D3A1V0KE78',
      questionBankId,
      questionType: 'essay',
      points: 3,
    });
    expect(JSON.stringify(question)).not.toContain('correct');
    expect(JSON.stringify(question)).not.toContain('answer');
  });

  it('requires whole-number quiz question points', () => {
    expect(() =>
      QuizQuestion.parse({
        id: '01J9QW7B6N5W2YH3D3A1V0KE44',
        tenantId,
        quizId,
        position: 0,
        questionType: 'short_answer',
        prompt: 'Explain why the evidence supports the claim.',
        points: 1.5,
        choices: [],
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('accepts private quiz answer keys for automatically graded question types', () => {
    expect(
      QuizQuestionAnswerKey.parse({
        kind: 'choice',
        correctChoiceIds: ['b'],
      }),
    ).toEqual({
      kind: 'choice',
      correctChoiceIds: ['b'],
    });

    expect(
      QuizQuestionAnswerKey.parse({
        kind: 'numeric',
        value: 3.14,
        tolerance: 0.01,
      }),
    ).toEqual({
      kind: 'numeric',
      value: 3.14,
      tolerance: 0.01,
    });
  });

  it('accepts quiz attempt summaries', () => {
    expect(
      QuizAttempt.parse({
        id: quizAttemptId,
        tenantId,
        quizId,
        studentId,
        attemptNumber: 1,
        status: 'submitted',
        startedAt: now,
        submittedAt: new Date('2026-05-10T00:30:00.000Z'),
        score: 8,
        createdAt: now,
        updatedAt: now,
      }),
    ).toMatchObject({ id: quizAttemptId, status: 'submitted', score: 8 });
  });

  it('accepts quiz attempt responses without answer keys', () => {
    const response = QuizAttemptResponse.parse({
      id: quizAttemptResponseId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      answer: {
        kind: 'choice',
        selectedChoiceIds: ['b'],
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(response).toMatchObject({
      attemptId: quizAttemptId,
      quizId,
      questionId: quizQuestionId,
      answer: {
        kind: 'choice',
        selectedChoiceIds: ['b'],
      },
    });
    expect(JSON.stringify(response)).not.toContain('correct');
  });

  it('accepts generated attempt probes without storing a question type', () => {
    const probe = QuizAttemptProbe.parse({
      id: quizAttemptProbeId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      learningObjectiveId,
      sourceQuestionBankQuestionId: null,
      position: 0,
      difficultyTarget: 0.65,
      prompt: 'Explain why the quotation supports the claim.',
      renderModel: {
        format: 'free_response',
        instructions: 'Answer in two sentences.',
      },
      points: 4,
      answerKey: {
        kind: 'text',
        acceptedAnswers: ['The quotation supports the claim because it gives evidence.'],
        caseSensitive: false,
      },
      aiGenerationLogId: '01J9QW7B6N5W2YH3D3A1V0KE63',
      createdAt: now,
    });

    expect(probe).not.toHaveProperty('questionType');
    expect(probe.learningObjectiveId).toBe(learningObjectiveId);
  });

  it('accepts generated attempt probe responses keyed by probe identity', () => {
    const response = QuizAttemptProbeResponse.parse({
      id: quizAttemptProbeResponseId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      probeId: quizAttemptProbeId,
      answer: {
        kind: 'text',
        text: 'The quotation supports the claim because it gives evidence.',
      },
      createdAt: now,
      updatedAt: now,
    });

    expect(response.probeId).toBe(quizAttemptProbeId);
  });

  it('requires quiz choice responses to select at least one choice', () => {
    expect(() =>
      QuizAttemptResponse.parse({
        id: quizAttemptResponseId,
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        questionId: quizQuestionId,
        answer: {
          kind: 'choice',
          selectedChoiceIds: [],
        },
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('accepts true_false and numeric question types', () => {
    const trueFalseQuestion = QuizQuestion.parse({
      id: quizQuestionId,
      tenantId,
      quizId,
      questionType: 'true_false',
      prompt: 'The sky is blue.',
      points: 1,
      position: 0,
      choices: [
        { id: 't', text: 'True' },
        { id: 'f', text: 'False' },
      ],
      createdAt: now,
      updatedAt: now,
    });
    expect(trueFalseQuestion.questionType).toBe('true_false');

    const numericQuestion = QuizQuestion.parse({
      id: quizQuestionId,
      tenantId,
      quizId,
      questionType: 'numeric',
      prompt: 'What is 2 + 2?',
      points: 1,
      position: 1,
      choices: [],
      createdAt: now,
      updatedAt: now,
    });
    expect(numericQuestion.questionType).toBe('numeric');
  });

  it('accepts a numeric answer for a quiz attempt response', () => {
    const response = QuizAttemptResponse.parse({
      id: quizAttemptResponseId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      answer: { kind: 'numeric', value: 42 },
      createdAt: now,
      updatedAt: now,
    });
    expect(response.answer.kind).toBe('numeric');
  });

  it('rejects non-finite numeric answers', () => {
    expect(() =>
      QuizAttemptResponse.parse({
        id: quizAttemptResponseId,
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        questionId: quizQuestionId,
        answer: { kind: 'numeric', value: Number.POSITIVE_INFINITY },
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('accepts matching question type with pair-shaped answer', () => {
    const matchingQuestion = QuizQuestion.parse({
      id: quizQuestionId,
      tenantId,
      quizId,
      questionType: 'matching',
      prompt: 'Match country to capital.',
      points: 2,
      position: 2,
      choices: [
        { id: 'fr', text: 'France' },
        { id: 'jp', text: 'Japan' },
        { id: 'paris', text: 'Paris' },
        { id: 'tokyo', text: 'Tokyo' },
      ],
      createdAt: now,
      updatedAt: now,
    });
    expect(matchingQuestion.questionType).toBe('matching');

    const response = QuizAttemptResponse.parse({
      id: quizAttemptResponseId,
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      answer: {
        kind: 'pairs',
        pairs: [
          { leftId: 'fr', rightId: 'paris' },
          { leftId: 'jp', rightId: 'tokyo' },
        ],
      },
      createdAt: now,
      updatedAt: now,
    });
    expect(response.answer.kind).toBe('pairs');
  });

  it('rejects empty pairs in a matching answer', () => {
    expect(() =>
      QuizAttemptResponse.parse({
        id: quizAttemptResponseId,
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        questionId: quizQuestionId,
        answer: { kind: 'pairs', pairs: [] },
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });
});
