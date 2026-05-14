import type {
  QuizAttemptResponse,
  QuizAttemptStatus,
  QuizQuestion,
  QuizQuestionAnswerKey,
} from '@openlms/contracts';

export type AutoGradableQuizQuestion = QuizQuestion & {
  answerKey: QuizQuestionAnswerKey | null;
};

export type QuizAutoGradeResult = {
  status: Extract<QuizAttemptStatus, 'submitted' | 'graded'>;
  score: number | null;
  maxScore: number;
  pendingManualQuestionIds: string[];
};

export type QuizAttemptManualQuestionGrade = {
  questionId: string;
  score: number;
};

const sortedValues = (values: string[]): string[] => [...values].sort((a, b) => a.localeCompare(b));

const sameStringSet = (left: string[], right: string[]): boolean => {
  const leftSorted = sortedValues(left);
  const rightSorted = sortedValues(right);

  return (
    leftSorted.length === rightSorted.length &&
    leftSorted.every((value, index) => value === rightSorted[index])
  );
};

const pairKey = (pair: { leftId: string; rightId: string }): string =>
  `${pair.leftId}\u0000${pair.rightId}`;

const normalizeAnswer = (value: string, caseSensitive: boolean): string => {
  const trimmed = value.trim();
  return caseSensitive ? trimmed : trimmed.toLocaleLowerCase();
};

const hasCompatibleAnswerKey = (question: AutoGradableQuizQuestion): boolean => {
  if (question.answerKey === null) {
    return false;
  }

  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false': {
      return question.answerKey.kind === 'choice';
    }
    case 'short_answer': {
      return question.answerKey.kind === 'text';
    }
    case 'numeric': {
      return question.answerKey.kind === 'numeric';
    }
    case 'matching': {
      return question.answerKey.kind === 'pairs';
    }
    case 'essay': {
      return false;
    }
  }
};

export const requiresManualQuizQuestionGrade = (question: AutoGradableQuizQuestion): boolean =>
  !hasCompatibleAnswerKey(question);

const isCorrect = (
  answerKey: QuizQuestionAnswerKey,
  response: QuizAttemptResponse | undefined,
): boolean => {
  if (!response) {
    return false;
  }

  switch (answerKey.kind) {
    case 'choice': {
      return (
        response.answer.kind === 'choice' &&
        sameStringSet(response.answer.selectedChoiceIds, answerKey.correctChoiceIds)
      );
    }
    case 'text': {
      if (response.answer.kind !== 'text') {
        return false;
      }

      const responseText = normalizeAnswer(response.answer.text, answerKey.caseSensitive);
      return answerKey.acceptedAnswers
        .map((answer) => normalizeAnswer(answer, answerKey.caseSensitive))
        .includes(responseText);
    }
    case 'numeric': {
      return (
        response.answer.kind === 'numeric' &&
        Math.abs(response.answer.value - answerKey.value) <= answerKey.tolerance
      );
    }
    case 'pairs': {
      return (
        response.answer.kind === 'pairs' &&
        sameStringSet(response.answer.pairs.map(pairKey), answerKey.pairs.map(pairKey))
      );
    }
  }
};

export const gradeQuizAttemptResponses = (input: {
  questions: AutoGradableQuizQuestion[];
  responses: QuizAttemptResponse[];
}): QuizAutoGradeResult => {
  const responseByQuestionId = new Map(
    input.responses.map((response) => [response.questionId, response]),
  );
  const pendingManualQuestionIds = input.questions
    .filter((question) => !hasCompatibleAnswerKey(question))
    .map((question) => question.id);
  const maxScore = input.questions.reduce((sum, question) => sum + question.points, 0);

  if (pendingManualQuestionIds.length > 0) {
    return {
      status: 'submitted',
      score: null,
      maxScore,
      pendingManualQuestionIds,
    };
  }

  const score = input.questions.reduce((sum, question) => {
    if (!question.answerKey) {
      return sum;
    }

    const response = responseByQuestionId.get(question.id);
    return isCorrect(question.answerKey, response) ? sum + question.points : sum;
  }, 0);

  return {
    status: 'graded',
    score,
    maxScore,
    pendingManualQuestionIds: [],
  };
};

export const gradeQuizAttemptResponsesWithManualGrades = (input: {
  questions: AutoGradableQuizQuestion[];
  responses: QuizAttemptResponse[];
  manualGrades: QuizAttemptManualQuestionGrade[];
}): QuizAutoGradeResult => {
  const responseByQuestionId = new Map(
    input.responses.map((response) => [response.questionId, response]),
  );
  const manualGradeByQuestionId = new Map(
    input.manualGrades.map((grade) => [grade.questionId, grade.score]),
  );
  const maxScore = input.questions.reduce((sum, question) => sum + question.points, 0);
  const pendingManualQuestionIds = input.questions
    .filter((question) => !hasCompatibleAnswerKey(question))
    .filter((question) => !manualGradeByQuestionId.has(question.id))
    .map((question) => question.id);

  if (pendingManualQuestionIds.length > 0) {
    return {
      status: 'submitted',
      score: null,
      maxScore,
      pendingManualQuestionIds,
    };
  }

  const score = input.questions.reduce((sum, question) => {
    if (!hasCompatibleAnswerKey(question)) {
      return sum + (manualGradeByQuestionId.get(question.id) ?? 0);
    }

    if (!question.answerKey) {
      return sum;
    }

    const response = responseByQuestionId.get(question.id);
    return isCorrect(question.answerKey, response) ? sum + question.points : sum;
  }, 0);

  return {
    status: 'graded',
    score,
    maxScore,
    pendingManualQuestionIds: [],
  };
};
