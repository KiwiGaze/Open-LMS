import { describe, expect, it } from 'vitest';
import {
  LearnerLearningPath,
  LearnerObjectiveState,
  LearningPathActivity,
} from '../src/adaptive-learning-path.ts';

const now = new Date('2026-05-13T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';

describe('adaptive learning path contracts', () => {
  it('captures objective readiness beyond module positions', () => {
    expect(
      LearnerObjectiveState.parse({
        objectiveId,
        masteryStatus: 'developing',
        readiness: 'remediate',
        confidence: 0.42,
        evidenceCount: 3,
        misconceptionIds: ['ratio-as-subtraction'],
        lastEvidenceAt: now,
      }),
    ).toMatchObject({
      objectiveId,
      readiness: 'remediate',
      confidence: 0.42,
      misconceptionIds: ['ratio-as-subtraction'],
    });
  });

  it('requires adaptive activities to explain why they are next-best work', () => {
    expect(
      LearningPathActivity.parse({
        activityType: 'practice',
        title: 'Practice ratio comparison',
        objectiveIds: [objectiveId],
        resource: {
          resourceType: 'course_resource',
          resourceId,
          title: 'Ratio examples',
          moduleId: null,
          position: 2,
        },
        priority: 86,
        required: true,
        rationale: 'Addresses the unresolved ratio-as-subtraction misconception.',
      }),
    ).toMatchObject({
      activityType: 'practice',
      priority: 86,
      required: true,
    });
  });

  it('models traditional fallback as a first-class path mode', () => {
    expect(
      LearnerLearningPath.parse({
        tenantId,
        courseId,
        studentId,
        mode: 'traditional',
        generatedAt: now,
        objectiveStates: [],
        activities: [
          {
            activityType: 'resource',
            title: 'Module 1',
            objectiveIds: [],
            resource: {
              resourceType: 'course_module',
              resourceId,
              title: 'Module 1',
              moduleId: resourceId,
              position: 0,
            },
            priority: 100,
            required: true,
            rationale: 'Traditional module order fallback.',
          },
        ],
        fallbackReason: 'Adaptive path unavailable: no learner evidence.',
      }),
    ).toMatchObject({
      mode: 'traditional',
      fallbackReason: 'Adaptive path unavailable: no learner evidence.',
    });
  });
});
