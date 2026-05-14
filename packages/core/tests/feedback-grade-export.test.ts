import { FeedbackGradeExportRow, Grade, PublishedFeedback, Submission } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildFeedbackGradeExportRows,
  serializeFeedbackGradeExportRows,
  serializeFeedbackGradeExportRowsJson,
} from '../src/exports/feedback-grade-export.ts';

const publishedAt = new Date('2026-05-10T00:00:00.000Z');

const row = FeedbackGradeExportRow.parse({
  assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  submissionId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  studentId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  score: 8.5,
  maxScore: 10,
  gradeStatus: 'published',
  feedbackVersion: 2,
  feedbackSource: 'ai_assisted',
  overallComment: 'Clear claim, but explain the evidence, especially the second quote.',
  publishedAt,
});

const submission = Submission.parse({
  id: row.submissionId,
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE31',
  assignmentId: row.assignmentId,
  studentId: row.studentId,
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE32',
  version: 1,
  status: 'submitted',
  contentSnapshot: [],
  submittedAt: publishedAt,
  createdAt: publishedAt,
});

const grade = Grade.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE33',
  tenantId: submission.tenantId,
  submissionId: submission.id,
  score: row.score,
  maxScore: row.maxScore,
  status: row.gradeStatus,
  source: 'manual',
  createdAt: publishedAt,
  updatedAt: publishedAt,
});

const feedback = PublishedFeedback.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE34',
  tenantId: submission.tenantId,
  submissionId: submission.id,
  source: row.feedbackSource,
  humanReviewId: null,
  criterionFeedback: [],
  overallComment: row.overallComment,
  linkedGradeId: grade.id,
  version: row.feedbackVersion,
  publishedAt,
});

describe('feedback and grade export serialization', () => {
  it('builds export rows from official submissions, grades, and published feedback', () => {
    const rows = buildFeedbackGradeExportRows({
      submissions: [submission],
      grades: [grade],
      publishedFeedback: [feedback],
    });

    expect(rows).toEqual([row]);
  });

  it('serializes feedback and grade rows to CSV with stable headers and escaping', () => {
    const csv = serializeFeedbackGradeExportRows([row]);

    expect(csv).toBe(
      [
        'assignment_id,submission_id,student_id,score,max_score,grade_status,feedback_version,feedback_source,overall_comment,published_at',
        '01J9QW7B6N5W2YH3D3A1V0KE2T,01J9QW7B6N5W2YH3D3A1V0KE2V,01J9QW7B6N5W2YH3D3A1V0KE2W,8.5,10,published,2,ai_assisted,"Clear claim, but explain the evidence, especially the second quote.",2026-05-10T00:00:00.000Z',
      ].join('\n'),
    );
  });

  it('serializes feedback and grade rows to portable JSON', () => {
    const json = serializeFeedbackGradeExportRowsJson([row]);

    expect(JSON.parse(json)).toEqual([
      expect.objectContaining({
        assignmentId: row.assignmentId,
        score: 8.5,
        publishedAt: '2026-05-10T00:00:00.000Z',
      }),
    ]);
  });
});
