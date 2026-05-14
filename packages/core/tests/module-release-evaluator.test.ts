import type {
  CourseId,
  CourseModuleId,
  LearningObjectiveId,
  ModuleReleaseRule,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  type ModuleReleaseEvaluatorInput,
  type ObjectiveMasterySnapshot,
  evaluateModuleRelease,
} from '../src/module-release/evaluator.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as CourseModuleId;
const prereqModuleId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as CourseModuleId;
const objectiveAId = '01J9QW7B6N5W2YH3D3A1V0KE2Y' as LearningObjectiveId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2Z' as UserId;
const baseTime = new Date('2026-05-12T10:00:00Z');

const ruleId = (suffix: string): string => `01J9QW7B6N5W2YH3D3A1V0KE${suffix}`;

const baseInput: ModuleReleaseEvaluatorInput = {
  tenantId,
  courseId,
  moduleId,
  targetType: 'module',
  targetId: null,
  studentId,
  rules: [],
  combinator: 'all',
  override: null,
  masteryByObjectiveId: new Map(),
  moduleObjectives: new Map(),
  now: baseTime,
};

const dateAfterRule = (
  releaseAt: Date,
  suffix: string,
  status: 'active' | 'archived' = 'active',
): ModuleReleaseRule =>
  ({
    id: ruleId(suffix),
    tenantId,
    courseId,
    moduleId,
    ruleType: 'date_after',
    config: { releaseAt },
    position: 0,
    status,
    createdAt: baseTime,
    updatedAt: baseTime,
  }) as ModuleReleaseRule;

describe('evaluateModuleRelease', () => {
  it('releases when there are no rules', () => {
    const result = evaluateModuleRelease(baseInput);
    expect(result.state).toBe('released');
    expect(result.ruleResults).toEqual([]);
    expect(result.blockers).toEqual([]);
  });

  it('honours an unlocked override regardless of rules', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [dateAfterRule(new Date('2099-01-01T00:00:00Z'), '30')],
      override: {
        id: ruleId('40'),
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: 'unlocked',
        reason: 'accommodation',
        grantedByUserId: null,
        grantedAt: baseTime,
        expiresAt: null,
        createdAt: baseTime,
        updatedAt: baseTime,
      } as ModuleReleaseEvaluatorInput['override'],
    });
    expect(result.state).toBe('released');
    expect(result.override?.state).toBe('unlocked');
  });

  it('locks when override state is locked even if rules pass', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      override: {
        id: ruleId('41'),
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: 'locked',
        reason: 'integrity hold',
        grantedByUserId: null,
        grantedAt: baseTime,
        expiresAt: null,
        createdAt: baseTime,
        updatedAt: baseTime,
      } as ModuleReleaseEvaluatorInput['override'],
    });
    expect(result.state).toBe('locked');
    expect(result.override?.state).toBe('locked');
  });

  it('ignores an expired override', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      override: {
        id: ruleId('42'),
        tenantId,
        courseId,
        moduleId,
        studentId,
        state: 'unlocked',
        reason: null,
        grantedByUserId: null,
        grantedAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      } as ModuleReleaseEvaluatorInput['override'],
    });
    expect(result.state).toBe('released');
    expect(result.override).toBeNull();
  });

  it('passes a date_after rule when now is past releaseAt', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [dateAfterRule(new Date('2026-05-01T00:00:00Z'), '50')],
    });
    expect(result.state).toBe('released');
    expect(result.ruleResults[0]?.passed).toBe(true);
  });

  it('blocks a date_after rule when now is before releaseAt', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [dateAfterRule(new Date('2099-01-01T00:00:00Z'), '51')],
    });
    expect(result.state).toBe('locked');
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]?.ruleType).toBe('date_after');
  });

  it('ignores item-scoped rules when evaluating a module target', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          ...dateAfterRule(new Date('2099-01-01T00:00:00Z'), '52'),
          targetType: 'assignment',
          targetId: '01J9QW7B6N5W2YH3D3A1V0KE4A',
        } as ModuleReleaseRule,
      ],
    });
    expect(result.state).toBe('released');
    expect(result.ruleResults).toEqual([]);
  });

  it('evaluates only the matching item-scoped rules for an item target', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      targetType: 'assignment',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE4A',
      rules: [
        {
          ...dateAfterRule(new Date('2099-01-01T00:00:00Z'), '53'),
          targetType: 'assignment',
          targetId: '01J9QW7B6N5W2YH3D3A1V0KE4A',
        } as ModuleReleaseRule,
        {
          ...dateAfterRule(new Date('2099-01-01T00:00:00Z'), '54'),
          targetType: 'assignment',
          targetId: '01J9QW7B6N5W2YH3D3A1V0KE4B',
        } as ModuleReleaseRule,
      ],
    });
    expect(result.state).toBe('locked');
    expect(result.targetType).toBe('assignment');
    expect(result.targetId).toBe('01J9QW7B6N5W2YH3D3A1V0KE4A');
    expect(result.ruleResults).toHaveLength(1);
  });

  it('passes objective_mastery when status meets the threshold', () => {
    const masteryByObjectiveId = new Map<LearningObjectiveId, ObjectiveMasterySnapshot>([
      [objectiveAId, { status: 'proficient', score: 90, maxScore: 100 }],
    ]);
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('60'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'objective_mastery',
          config: { objectiveId: objectiveAId, minStatus: 'proficient', minScorePercent: 80 },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
      masteryByObjectiveId,
    });
    expect(result.state).toBe('released');
  });

  it('blocks objective_mastery when status is below threshold', () => {
    const masteryByObjectiveId = new Map<LearningObjectiveId, ObjectiveMasterySnapshot>([
      [objectiveAId, { status: 'developing', score: 60, maxScore: 100 }],
    ]);
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('61'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'objective_mastery',
          config: { objectiveId: objectiveAId, minStatus: 'proficient', minScorePercent: null },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
      masteryByObjectiveId,
    });
    expect(result.state).toBe('locked');
  });

  it('blocks objective_mastery when score percentage is below the threshold even if status passes', () => {
    const masteryByObjectiveId = new Map<LearningObjectiveId, ObjectiveMasterySnapshot>([
      [objectiveAId, { status: 'proficient', score: 70, maxScore: 100 }],
    ]);
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('62'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'objective_mastery',
          config: { objectiveId: objectiveAId, minStatus: 'proficient', minScorePercent: 80 },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
      masteryByObjectiveId,
    });
    expect(result.state).toBe('locked');
  });

  it('passes prerequisite_modules when all prerequisite objectives are mastered', () => {
    const prereqObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE3A' as LearningObjectiveId;
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('70'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [prereqModuleId], requireAll: true },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
      moduleObjectives: new Map([[prereqModuleId, [prereqObjectiveId]]]),
      masteryByObjectiveId: new Map([
        [prereqObjectiveId, { status: 'proficient', score: 100, maxScore: 100 }],
      ]),
    });
    expect(result.state).toBe('released');
  });

  it('blocks prerequisite_modules when prerequisite has no objectives attached', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('71'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [prereqModuleId], requireAll: true },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
      moduleObjectives: new Map([[prereqModuleId, []]]),
      masteryByObjectiveId: new Map(),
    });
    expect(result.state).toBe('locked');
  });

  it('passes prerequisite_modules requireAll=false when any prerequisite is mastered', () => {
    const objA = '01J9QW7B6N5W2YH3D3A1V0KE3B' as LearningObjectiveId;
    const objB = '01J9QW7B6N5W2YH3D3A1V0KE3C' as LearningObjectiveId;
    const moduleA = '01J9QW7B6N5W2YH3D3A1V0KE3D' as CourseModuleId;
    const moduleB = '01J9QW7B6N5W2YH3D3A1V0KE3E' as CourseModuleId;
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('72'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'prerequisite_modules',
          config: { moduleIds: [moduleA, moduleB], requireAll: false },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
      moduleObjectives: new Map([
        [moduleA, [objA]],
        [moduleB, [objB]],
      ]),
      masteryByObjectiveId: new Map([
        [objA, { status: 'developing', score: 50, maxScore: 100 }],
        [objB, { status: 'mastered', score: 100, maxScore: 100 }],
      ]),
    });
    expect(result.state).toBe('released');
  });

  it('manual_unlock with defaultLocked=true blocks when no override exists', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [
        {
          id: ruleId('80'),
          tenantId,
          courseId,
          moduleId,
          ruleType: 'manual_unlock',
          config: { defaultLocked: true },
          position: 0,
          status: 'active',
          createdAt: baseTime,
          updatedAt: baseTime,
        } as ModuleReleaseRule,
      ],
    });
    expect(result.state).toBe('locked');
  });

  it('combinator=any releases when at least one rule passes', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      combinator: 'any',
      rules: [
        dateAfterRule(new Date('2099-01-01T00:00:00Z'), '90'),
        {
          ...dateAfterRule(new Date('2026-01-01T00:00:00Z'), '91'),
          position: 1,
        },
      ],
    });
    expect(result.state).toBe('released');
  });

  it('skips archived rules', () => {
    const result = evaluateModuleRelease({
      ...baseInput,
      rules: [dateAfterRule(new Date('2099-01-01T00:00:00Z'), 'A0', 'archived')],
    });
    expect(result.state).toBe('released');
  });

  it('evaluatedAt equals input now', () => {
    const result = evaluateModuleRelease(baseInput);
    expect(result.evaluatedAt.getTime()).toBe(baseTime.getTime());
  });
});
