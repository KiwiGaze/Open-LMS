import {
  DiscussionGradebookEntry,
  type DiscussionGradebookEntry as DiscussionGradebookEntryContract,
} from '@openlms/contracts';

const csvHeaders = [
  'topic_id',
  'topic_title',
  'post_id',
  'student_id',
  'grade_id',
  'score',
  'max_score',
  'status',
  'comment',
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

const toExportValues = (entry: DiscussionGradebookEntryContract): (string | number | null)[] => [
  entry.topicId,
  entry.topicTitle,
  entry.postId,
  entry.studentId,
  entry.gradeId,
  entry.score,
  entry.maxScore,
  entry.status,
  entry.comment,
  entry.gradedAt.toISOString(),
];

export const serializeDiscussionGradebookEntriesAsCsv = (
  entries: DiscussionGradebookEntryContract[],
): string => {
  const body = entries
    .map((entry) => DiscussionGradebookEntry.parse(entry))
    .map((entry) => toExportValues(entry).map(toCsvValue).join(','));

  return [csvHeaders.join(','), ...body].join('\n');
};
