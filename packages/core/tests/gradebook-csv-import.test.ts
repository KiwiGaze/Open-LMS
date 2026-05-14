import { describe, expect, it } from 'vitest';
import { parseSubmissionGradeImportCsv } from '../src/exports/gradebook-csv-import.ts';

describe('submission grade CSV import', () => {
  it('parses assignment grade import rows with stable headers', () => {
    expect(
      parseSubmissionGradeImportCsv(
        [
          'submission_id,score,max_score,status',
          '01J9QW7B6N5W2YH3D3A1V0KE2T,8.5,10,published',
        ].join('\n'),
      ),
    ).toEqual([
      {
        rowNumber: 2,
        submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
        score: 8.5,
        maxScore: 10,
        status: 'published',
      },
    ]);
  });

  it('accepts incomplete grade rows for offline grade imports', () => {
    expect(
      parseSubmissionGradeImportCsv(
        ['submission_id,score,max_score,status', '01J9QW7B6N5W2YH3D3A1V0KE2T,0,10,incomplete'].join(
          '\n',
        ),
      )[0],
    ).toMatchObject({
      rowNumber: 2,
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      score: 0,
      maxScore: 10,
      status: 'incomplete',
    });
  });

  it('rejects rows whose score exceeds max score with row context', () => {
    expect(() =>
      parseSubmissionGradeImportCsv(
        ['submission_id,score,max_score,status', '01J9QW7B6N5W2YH3D3A1V0KE2T,11,10,published'].join(
          '\n',
        ),
      ),
    ).toThrow('Submission grade CSV row 2 has score greater than max_score.');
  });

  it('requires the import headers used by the gradebook export workflow', () => {
    expect(() => parseSubmissionGradeImportCsv('submission_id,score\n')).toThrow(
      'Submission grade CSV must include submission_id, score, max_score, and status headers.',
    );
  });
});
