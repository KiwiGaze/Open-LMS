import { DiscussionGradebookEntry } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { serializeDiscussionGradebookEntriesAsCsv } from '../src/exports/discussion-gradebook-csv-export.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE60';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE61';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE62';
const postId = '01J9QW7B6N5W2YH3D3A1V0KE63';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE64';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KE65';
const gradedAt = new Date('2026-05-12T10:00:00.000Z');

const baseEntry = DiscussionGradebookEntry.parse({
  id: `discussion_gradebook_entry:${gradeId}`,
  tenantId,
  courseId,
  topicId,
  topicTitle: 'Week 1 evidence workshop',
  postId,
  studentId,
  gradeId,
  score: 9,
  maxScore: 10,
  status: 'published',
  comment: 'Strong analysis.',
  gradedAt,
});

describe('serializeDiscussionGradebookEntriesAsCsv', () => {
  it('emits the header row when there are no entries', () => {
    const csv = serializeDiscussionGradebookEntriesAsCsv([]);
    expect(csv).toBe(
      'topic_id,topic_title,post_id,student_id,grade_id,score,max_score,status,comment,graded_at',
    );
  });

  it('serializes a single entry with ISO timestamp', () => {
    const csv = serializeDiscussionGradebookEntriesAsCsv([baseEntry]);
    const rows = csv.split('\n');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toBe(
      [
        topicId,
        'Week 1 evidence workshop',
        postId,
        studentId,
        gradeId,
        '9',
        '10',
        'published',
        'Strong analysis.',
        '2026-05-12T10:00:00.000Z',
      ].join(','),
    );
  });

  it('leaves comment empty when null', () => {
    const csv = serializeDiscussionGradebookEntriesAsCsv([
      DiscussionGradebookEntry.parse({ ...baseEntry, comment: null }),
    ]);
    const cells = (csv.split('\n')[1] ?? '').split(',');
    expect(cells[8]).toBe('');
  });

  it('quotes commas in topic title', () => {
    const csv = serializeDiscussionGradebookEntriesAsCsv([
      DiscussionGradebookEntry.parse({ ...baseEntry, topicTitle: 'Evidence, citations, and tone' }),
    ]);
    expect(csv).toContain('"Evidence, citations, and tone"');
  });
});
