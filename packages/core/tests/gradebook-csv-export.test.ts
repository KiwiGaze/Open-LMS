import { GradebookEntry } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { serializeGradebookEntriesAsCsv } from '../src/exports/gradebook-csv-export.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const dueAt = new Date('2026-05-10T00:00:00.000Z');
const submittedAt = new Date('2026-05-09T00:00:00.000Z');
const gradedAt = new Date('2026-05-11T00:00:00.000Z');

const baseEntry = GradebookEntry.parse({
  id: 'gradebook_entry:01J9QW7B6N5W2YH3D3A1V0KE40',
  tenantId,
  courseId,
  assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE33',
  assignmentTitle: 'Essay 1',
  assignmentDueAt: dueAt,
  gradebookCategoryId: '01J9QW7B6N5W2YH3D3A1V0KE34',
  gradebookCategoryName: 'Written work',
  studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
  submissionId: '01J9QW7B6N5W2YH3D3A1V0KE36',
  submittedAt,
  gradeId: '01J9QW7B6N5W2YH3D3A1V0KE40',
  score: 8.5,
  maxScore: 10,
  gradeStatus: 'published',
  gradeSource: 'manual',
  gradedAt,
});

describe('serializeGradebookEntriesAsCsv', () => {
  it('emits the header row even when there are no entries', () => {
    const csv = serializeGradebookEntriesAsCsv([]);
    expect(csv).toBe(
      'assignment_id,assignment_title,assignment_due_at,assignment_extra_credit,gradebook_category_id,gradebook_category_name,student_id,submission_id,submitted_at,grade_id,score,max_score,grade_status,grade_source,graded_at',
    );
  });

  it('serializes a single entry with ISO timestamps', () => {
    const csv = serializeGradebookEntriesAsCsv([baseEntry]);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      [
        baseEntry.assignmentId,
        'Essay 1',
        '2026-05-10T00:00:00.000Z',
        'false',
        baseEntry.gradebookCategoryId,
        'Written work',
        baseEntry.studentId,
        baseEntry.submissionId,
        '2026-05-09T00:00:00.000Z',
        baseEntry.gradeId,
        '8.5',
        '10',
        'published',
        'manual',
        '2026-05-11T00:00:00.000Z',
      ].join(','),
    );
  });

  it('emits true for extra-credit assignments', () => {
    const entry = GradebookEntry.parse({ ...baseEntry, assignmentExtraCredit: true });
    const csv = serializeGradebookEntriesAsCsv([entry]);
    const cells = (csv.split('\n')[1] ?? '').split(',');
    expect(cells[3]).toBe('true');
  });

  it('quotes commas, quotes, and newlines in text fields', () => {
    const entry = GradebookEntry.parse({
      ...baseEntry,
      assignmentTitle: 'Essay, "Module 3" reflection',
      gradebookCategoryName: 'Written\nwork',
    });

    const csv = serializeGradebookEntriesAsCsv([entry]);

    expect(csv).toContain('"Essay, ""Module 3"" reflection"');
    expect(csv).toContain('"Written\nwork"');
  });

  it('leaves nullable category and due-date fields empty', () => {
    const entry = GradebookEntry.parse({
      ...baseEntry,
      assignmentDueAt: null,
      gradebookCategoryId: null,
      gradebookCategoryName: null,
    });

    const csv = serializeGradebookEntriesAsCsv([entry]);
    const row = csv.split('\n')[1] ?? '';
    const cells = row.split(',');

    expect(cells[2]).toBe('');
    expect(cells[4]).toBe('');
    expect(cells[5]).toBe('');
  });
});
