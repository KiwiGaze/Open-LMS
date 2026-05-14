import type {
  CourseId,
  CourseModuleId,
  LearningObjectiveId,
  ModuleReleaseDecision,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildLearnerLearningPath,
  buildReleasedLearnerLearningPath,
} from '../src/courses/adaptive-learning-path.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as UserId;
const moduleAId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as CourseModuleId;
const moduleBId = '01J9QW7B6N5W2YH3D3A1V0KE2Y' as CourseModuleId;
const objectiveAId = '01J9QW7B6N5W2YH3D3A1V0KE2Z' as LearningObjectiveId;
const objectiveBId = '01J9QW7B6N5W2YH3D3A1V0KE30' as LearningObjectiveId;
const objectiveCId = '01J9QW7B6N5W2YH3D3A1V0KE33' as LearningObjectiveId;
const now = new Date('2026-05-13T00:00:00.000Z');

const modules = [
  {
    id: moduleBId,
    title: 'Second module',
    position: 1,
    learningObjectiveIds: [objectiveBId],
  },
  {
    id: moduleAId,
    title: 'First module',
    position: 0,
    learningObjectiveIds: [objectiveAId],
  },
];

const moduleReleaseDecision = (
  moduleId: CourseModuleId,
  state: ModuleReleaseDecision['state'],
): ModuleReleaseDecision => ({
  moduleId,
  targetType: 'module',
  targetId: null,
  state,
  evaluatedAt: now,
  sourceCombinator: 'all',
  ruleResults: [],
  blockers:
    state === 'locked'
      ? [
          {
            ruleType: 'objective_mastery',
            summary: 'Prerequisite objective is not proficient yet.',
            requiredAction: 'Complete prerequisite practice.',
          },
        ]
      : [],
  override: null,
});

const itemReleaseDecision = (
  moduleId: CourseModuleId,
  targetId: string,
  state: ModuleReleaseDecision['state'],
): ModuleReleaseDecision => ({
  moduleId,
  targetType: 'course_resource',
  targetId,
  state,
  evaluatedAt: now,
  sourceCombinator: 'all',
  ruleResults: [],
  blockers:
    state === 'locked'
      ? [
          {
            ruleType: 'date_after',
            summary: 'Practice unlocks tomorrow.',
            requiredAction: 'Return after the release date.',
          },
        ]
      : [],
  override: null,
});

describe('buildLearnerLearningPath', () => {
  it('falls back to traditional module order when adaptive mode is disabled', () => {
    const path = buildLearnerLearningPath({
      tenantId,
      courseId,
      studentId,
      mode: 'traditional',
      modules,
      resources: [],
      objectiveStates: [],
      generatedAt: now,
    });

    expect(path.mode).toBe('traditional');
    expect(path.activities.map((activity) => activity.resource?.resourceId)).toEqual([
      moduleAId,
      moduleBId,
    ]);
    expect(path.activities.every((activity) => activity.rationale.includes('fallback'))).toBe(true);
  });

  it('falls back to traditional order when no objective evidence exists', () => {
    const path = buildLearnerLearningPath({
      tenantId,
      courseId,
      studentId,
      mode: 'adaptive',
      modules,
      resources: [],
      objectiveStates: [],
      generatedAt: now,
    });

    expect(path.mode).toBe('traditional');
    expect(path.fallbackReason).toBe('Adaptive path unavailable: no learner evidence.');
    expect(path.activities.map((activity) => activity.resource?.resourceId)).toEqual([
      moduleAId,
      moduleBId,
    ]);
  });

  it('prioritizes remediation for low-confidence misconceptions over module position', () => {
    const path = buildLearnerLearningPath({
      tenantId,
      courseId,
      studentId,
      mode: 'adaptive',
      modules,
      resources: [
        {
          id: '01J9QW7B6N5W2YH3D3A1V0KE31',
          title: 'Ratio misconception practice',
          resourceType: 'course_resource',
          moduleId: moduleBId,
          position: 0,
          learningObjectiveIds: [objectiveBId],
        },
        {
          id: '01J9QW7B6N5W2YH3D3A1V0KE32',
          title: 'Warm-up reading',
          resourceType: 'course_page',
          moduleId: moduleAId,
          position: 0,
          learningObjectiveIds: [objectiveAId],
        },
      ],
      objectiveStates: [
        {
          objectiveId: objectiveAId,
          masteryStatus: 'proficient',
          readiness: 'ready',
          confidence: 0.8,
          evidenceCount: 4,
          misconceptionIds: [],
          lastEvidenceAt: now,
        },
        {
          objectiveId: objectiveBId,
          masteryStatus: 'developing',
          readiness: 'remediate',
          confidence: 0.2,
          evidenceCount: 5,
          misconceptionIds: ['ratio-as-subtraction'],
          lastEvidenceAt: now,
        },
      ],
      generatedAt: now,
    });

    expect(path.mode).toBe('adaptive');
    expect(path.activities[0]).toMatchObject({
      activityType: 'practice',
      title: 'Ratio misconception practice',
      priority: 100,
      required: true,
    });
    expect(path.activities[0]?.rationale).toContain('ratio-as-subtraction');
  });

  it('skips locked adaptive resources and selects the next released learner-state candidate', () => {
    const lockedResourceId = '01J9QW7B6N5W2YH3D3A1V0KE34';
    const releasedResourceId = '01J9QW7B6N5W2YH3D3A1V0KE35';

    const path = buildReleasedLearnerLearningPath({
      tenantId,
      courseId,
      studentId,
      mode: 'adaptive',
      modules,
      resources: [
        {
          id: lockedResourceId,
          title: 'Locked misconception practice',
          resourceType: 'course_resource',
          moduleId: moduleBId,
          position: 0,
          learningObjectiveIds: [objectiveBId],
        },
        {
          id: releasedResourceId,
          title: 'Released goal practice',
          resourceType: 'course_resource',
          moduleId: moduleAId,
          position: 1,
          learningObjectiveIds: [objectiveAId],
        },
      ],
      objectiveStates: [
        {
          objectiveId: objectiveBId,
          masteryStatus: 'developing',
          readiness: 'remediate',
          confidence: 0.15,
          evidenceCount: 4,
          misconceptionIds: ['ratio-as-subtraction'],
          lastEvidenceAt: now,
        },
        {
          objectiveId: objectiveAId,
          masteryStatus: 'developing',
          readiness: 'ready',
          confidence: 0.65,
          evidenceCount: 2,
          misconceptionIds: [],
          lastEvidenceAt: now,
        },
      ],
      releaseDecisions: [
        moduleReleaseDecision(moduleAId, 'released'),
        moduleReleaseDecision(moduleBId, 'released'),
        itemReleaseDecision(moduleBId, lockedResourceId, 'locked'),
      ],
      generatedAt: now,
    });

    expect(path.mode).toBe('adaptive');
    expect(path.activities.map((activity) => activity.resource?.resourceId)).toEqual([
      releasedResourceId,
    ]);
    expect(path.activities[0]?.selectionSignals).toContain('release_available');
  });

  it('falls back to traditional order when learner-state candidates are all locked', () => {
    const lockedResourceId = '01J9QW7B6N5W2YH3D3A1V0KE36';

    const path = buildReleasedLearnerLearningPath({
      tenantId,
      courseId,
      studentId,
      mode: 'adaptive',
      modules,
      resources: [
        {
          id: lockedResourceId,
          title: 'Locked stretch project',
          resourceType: 'course_resource',
          moduleId: moduleBId,
          position: 0,
          learningObjectiveIds: [objectiveCId],
        },
      ],
      objectiveStates: [
        {
          objectiveId: objectiveCId,
          masteryStatus: 'mastered',
          readiness: 'stretch',
          confidence: 0.9,
          evidenceCount: 6,
          misconceptionIds: [],
          lastEvidenceAt: now,
        },
      ],
      releaseDecisions: [
        moduleReleaseDecision(moduleAId, 'released'),
        moduleReleaseDecision(moduleBId, 'locked'),
      ],
      generatedAt: now,
    });

    expect(path.mode).toBe('traditional');
    expect(path.fallbackReason).toBe(
      'Adaptive path unavailable: learner-state candidates are not released yet.',
    );
    expect(path.activities.map((activity) => activity.resource?.resourceId)).toEqual([
      moduleAId,
      moduleBId,
    ]);
  });
});
