import {
  FeedbackGradeExportRow,
  type FeedbackGradeExportRow as FeedbackGradeExportRowContract,
  Grade,
  type Grade as GradeContract,
  PublishedFeedback,
  type PublishedFeedback as PublishedFeedbackContract,
  Submission,
  type Submission as SubmissionContract,
} from '@openlms/contracts';

export type BuildFeedbackGradeExportRowsInput = {
  submissions: SubmissionContract[];
  grades: GradeContract[];
  publishedFeedback: PublishedFeedbackContract[];
};

const csvHeaders = [
  'assignment_id',
  'submission_id',
  'student_id',
  'score',
  'max_score',
  'grade_status',
  'feedback_version',
  'feedback_source',
  'overall_comment',
  'published_at',
];

const toCsvValue = (value: string | number | null): string => {
  if (value === null) {
    return '';
  }

  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
};

const toExportValues = (row: FeedbackGradeExportRowContract): (string | number | null)[] => [
  row.assignmentId,
  row.submissionId,
  row.studentId,
  row.score,
  row.maxScore,
  row.gradeStatus,
  row.feedbackVersion,
  row.feedbackSource,
  row.overallComment,
  row.publishedAt?.toISOString() ?? null,
];

export const buildFeedbackGradeExportRows = (
  input: BuildFeedbackGradeExportRowsInput,
): FeedbackGradeExportRowContract[] => {
  const gradesBySubmissionId = new Map(
    input.grades.map((grade) => {
      const parsed = Grade.parse(grade);
      return [parsed.submissionId, parsed];
    }),
  );
  const feedbackBySubmissionId = new Map<string, PublishedFeedbackContract>();

  for (const feedback of input.publishedFeedback.map((value) => PublishedFeedback.parse(value))) {
    const existing = feedbackBySubmissionId.get(feedback.submissionId);
    if (!existing || feedback.version > existing.version) {
      feedbackBySubmissionId.set(feedback.submissionId, feedback);
    }
  }

  return input.submissions.map((value) => {
    const submission = Submission.parse(value);
    const grade = gradesBySubmissionId.get(submission.id) ?? null;
    const feedback = feedbackBySubmissionId.get(submission.id) ?? null;

    return FeedbackGradeExportRow.parse({
      assignmentId: submission.assignmentId,
      submissionId: submission.id,
      studentId: submission.studentId,
      score: grade?.score ?? null,
      maxScore: grade?.maxScore ?? null,
      gradeStatus: grade?.status ?? null,
      feedbackVersion: feedback?.version ?? null,
      feedbackSource: feedback?.source ?? null,
      overallComment: feedback?.overallComment ?? null,
      publishedAt: feedback?.publishedAt ?? null,
    });
  });
};

export const serializeFeedbackGradeExportRows = (
  rows: FeedbackGradeExportRowContract[],
): string => {
  const body = rows
    .map((row) => FeedbackGradeExportRow.parse(row))
    .map((row) => toExportValues(row).map(toCsvValue).join(','));

  return [csvHeaders.join(','), ...body].join('\n');
};

export const serializeFeedbackGradeExportRowsJson = (
  rows: FeedbackGradeExportRowContract[],
): string =>
  JSON.stringify(
    rows.map((row) => {
      const parsed = FeedbackGradeExportRow.parse(row);
      return {
        ...parsed,
        publishedAt: parsed.publishedAt?.toISOString() ?? null,
      };
    }),
  );
