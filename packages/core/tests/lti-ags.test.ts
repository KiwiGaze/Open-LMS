import {
  AssignmentId,
  CourseExternalToolId,
  CourseExternalToolOutcomeId,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { buildLti1p3AgsResultContainer, mapLti1p3AgsScoreToOutcomeInput } from '../src/lti/ags.ts';

const tenantId = TenantId.parse('01J9QW7B6N5W2YH3D3A1V0KE2T');
const courseId = CourseId.parse('01J9QW7B6N5W2YH3D3A1V0KE2S');
const assignmentId = AssignmentId.parse('01J9QW7B6N5W2YH3D3A1V0KE2W');
const externalToolId = CourseExternalToolId.parse('01J9QW7B6N5W2YH3D3A1V0KE33');
const userId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE2V');
const now = new Date('2026-05-10T00:00:00.000Z');
const lineItemUrl =
  'https://lms.example.edu/api/v1/tenants/01J9QW7B6N5W2YH3D3A1V0KE2T/courses/01J9QW7B6N5W2YH3D3A1V0KE2S/assignments/01J9QW7B6N5W2YH3D3A1V0KE2W/external-tools/01J9QW7B6N5W2YH3D3A1V0KE33/lti-ags/lineitem';

describe('LTI 1.3 Assignment and Grade Services', () => {
  it('maps fully graded AGS scores into external tool outcomes', () => {
    const outcome = mapLti1p3AgsScoreToOutcomeInput({
      tenantId,
      courseId,
      assignmentId,
      externalToolId,
      score: {
        timestamp: now,
        scoreGiven: 9,
        scoreMaximum: 10,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        userId,
      },
    });

    expect(outcome).toEqual({
      tenantId,
      courseId,
      assignmentId,
      externalToolId,
      studentId: userId,
      score: 9,
      maxScore: 10,
      status: 'published',
      reportedAt: now,
    });
  });

  it('projects external tool outcomes into AGS result records', () => {
    const results = buildLti1p3AgsResultContainer({
      lineItemUrl,
      outcomes: [
        {
          id: CourseExternalToolOutcomeId.parse('01J9QW7B6N5W2YH3D3A1V0KE40'),
          tenantId,
          courseId,
          assignmentId,
          studentId: userId,
          externalToolId,
          score: 9,
          maxScore: 10,
          status: 'published',
          reportedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    expect(results).toEqual([
      {
        id: `${lineItemUrl}/results/${userId}`,
        scoreOf: lineItemUrl,
        userId,
        resultScore: 9,
        resultMaximum: 10,
      },
    ]);
  });
});
