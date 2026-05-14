import { GradebookEntry, type GradebookEntry as GradebookEntryContract } from '@openlms/contracts';

const csvHeaders = [
  'assignment_id',
  'assignment_title',
  'assignment_due_at',
  'assignment_extra_credit',
  'gradebook_category_id',
  'gradebook_category_name',
  'student_id',
  'submission_id',
  'submitted_at',
  'grade_id',
  'score',
  'max_score',
  'grade_status',
  'grade_source',
  'graded_at',
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

const toExportValues = (entry: GradebookEntryContract): (string | number | null)[] => [
  entry.assignmentId,
  entry.assignmentTitle,
  entry.assignmentDueAt?.toISOString() ?? null,
  entry.assignmentExtraCredit ? 'true' : 'false',
  entry.gradebookCategoryId,
  entry.gradebookCategoryName,
  entry.studentId,
  entry.submissionId,
  entry.submittedAt.toISOString(),
  entry.gradeId,
  entry.score,
  entry.maxScore,
  entry.gradeStatus,
  entry.gradeSource,
  entry.gradedAt.toISOString(),
];

export const serializeGradebookEntriesAsCsv = (entries: GradebookEntryContract[]): string => {
  const body = entries
    .map((entry) => GradebookEntry.parse(entry))
    .map((entry) => toExportValues(entry).map(toCsvValue).join(','));

  return [csvHeaders.join(','), ...body].join('\n');
};
