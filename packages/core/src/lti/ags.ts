import {
  type CourseExternalToolOutcome,
  type CourseExternalToolOutcomeStatus,
  Lti1p3AgsResultContainer,
  type Lti1p3AgsResultContainer as Lti1p3AgsResultContainerContract,
  type Lti1p3AgsScore,
} from '@openlms/contracts';

export type Lti1p3AgsOutcomeInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  externalToolId: string;
  score: number;
  maxScore: number;
  status: CourseExternalToolOutcomeStatus;
  reportedAt: Date;
};

const mapGradingProgressToOutcomeStatus = (
  gradingProgress: Lti1p3AgsScore['gradingProgress'],
): CourseExternalToolOutcomeStatus => {
  switch (gradingProgress) {
    case 'FullyGraded':
      return 'published';
    case 'Failed':
      return 'rejected';
    case 'Pending':
    case 'PendingManual':
    case 'NotReady':
      return 'pending';
  }
};

export const mapLti1p3AgsScoreToOutcomeInput = (input: {
  tenantId: string;
  courseId: string;
  assignmentId: string;
  externalToolId: string;
  score: Lti1p3AgsScore;
}): Lti1p3AgsOutcomeInput => {
  if (input.score.scoreGiven === undefined || input.score.scoreGiven === null) {
    throw new Error(
      'LTI AGS score clearing is not supported yet. Send scoreGiven and scoreMaximum to publish a score.',
    );
  }

  if (input.score.scoreMaximum === undefined) {
    throw new Error('LTI AGS scoreMaximum is required when scoreGiven is present.');
  }

  if (input.score.scoreGiven > input.score.scoreMaximum) {
    throw new Error(
      'LTI AGS scoreGiven cannot exceed scoreMaximum until extra-credit AGS outcomes are supported.',
    );
  }

  return {
    tenantId: input.tenantId,
    courseId: input.courseId,
    assignmentId: input.assignmentId,
    studentId: input.score.userId,
    externalToolId: input.externalToolId,
    score: input.score.scoreGiven,
    maxScore: input.score.scoreMaximum,
    status: mapGradingProgressToOutcomeStatus(input.score.gradingProgress),
    reportedAt: input.score.timestamp,
  };
};

export const buildLti1p3AgsResultContainer = (input: {
  lineItemUrl: string;
  outcomes: CourseExternalToolOutcome[];
  userId?: string;
}): Lti1p3AgsResultContainerContract => {
  const outcomes =
    input.userId === undefined
      ? input.outcomes
      : input.outcomes.filter((outcome) => outcome.studentId === input.userId);

  return Lti1p3AgsResultContainer.parse(
    outcomes.map((outcome) => ({
      id: `${input.lineItemUrl}/results/${outcome.studentId}`,
      scoreOf: input.lineItemUrl,
      userId: outcome.studentId,
      resultScore: outcome.score,
      resultMaximum: outcome.maxScore,
    })),
  );
};
