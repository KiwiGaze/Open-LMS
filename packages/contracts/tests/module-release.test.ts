import { describe, expect, it } from 'vitest';
import {
  AssignmentId,
  CourseResourceId,
  ModuleReleaseDateAfterConfig,
  ModuleReleaseDecision,
  ModuleReleaseManualUnlockConfig,
  ModuleReleaseObjectiveMasteryConfig,
  ModuleReleaseOverride,
  ModuleReleasePolicy,
  ModuleReleaseRule,
} from '../src/index.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const prereqModuleId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const ruleId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE34';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE35';
const policyId = '01J9QW7B6N5W2YH3D3A1V0KE30';
const overrideId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const grantedByUserId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const now = new Date('2026-05-12T10:00:00.000Z');

describe('module release contracts', () => {
  it('parses a prerequisite_modules rule', () => {
    const rule = ModuleReleaseRule.parse({
      id: ruleId,
      tenantId,
      courseId,
      moduleId,
      ruleType: 'prerequisite_modules',
      config: {
        moduleIds: [prereqModuleId],
        requireAll: true,
      },
      targetType: 'module',
      targetId: null,
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    expect(rule.ruleType).toBe('prerequisite_modules');
  });

  it('parses an item-scoped rule for a course resource', () => {
    const rule = ModuleReleaseRule.parse({
      id: ruleId,
      tenantId,
      courseId,
      moduleId,
      ruleType: 'date_after',
      config: {
        releaseAt: now,
      },
      targetType: 'course_resource',
      targetId: CourseResourceId.parse(resourceId),
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    expect(rule.targetType).toBe('course_resource');
    expect(rule.targetId).toBe(resourceId);
  });

  it('parses an item-scoped rule for a course page', () => {
    const rule = ModuleReleaseRule.parse({
      id: ruleId,
      tenantId,
      courseId,
      moduleId,
      ruleType: 'date_after',
      config: {
        releaseAt: now,
      },
      targetType: 'course_page',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE36',
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    expect(rule.targetType).toBe('course_page');
  });

  it('rejects item-scoped manual unlock rules', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        ruleType: 'manual_unlock',
        config: {
          defaultLocked: true,
        },
        targetType: 'assignment',
        targetId: AssignmentId.parse(assignmentId),
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('rejects item-scoped rules without an item target', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        ruleType: 'date_after',
        config: {
          releaseAt: now,
        },
        targetType: 'assignment',
        targetId: null,
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('rejects module-scoped rules with an item target', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        ruleType: 'date_after',
        config: {
          releaseAt: now,
        },
        targetType: 'module',
        targetId: AssignmentId.parse(assignmentId),
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('parses an objective_mastery rule with score threshold', () => {
    const config = ModuleReleaseObjectiveMasteryConfig.parse({
      objectiveId,
      minStatus: 'proficient',
      minScorePercent: 80,
    });
    expect(config.minScorePercent).toBe(80);
  });

  it('rejects an unknown ruleType', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        ruleType: 'eldritch_horror',
        config: {},
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('rejects a date_after rule whose config is missing releaseAt', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        ruleType: 'date_after',
        config: {},
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it('parses a date_after config from an ISO string', () => {
    const config = ModuleReleaseDateAfterConfig.parse({
      releaseAt: '2026-06-01T00:00:00.000Z',
    });
    expect(config.releaseAt.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('parses a manual_unlock config', () => {
    const config = ModuleReleaseManualUnlockConfig.parse({ defaultLocked: true });
    expect(config.defaultLocked).toBe(true);
  });

  it('parses a policy with combinator', () => {
    const policy = ModuleReleasePolicy.parse({
      id: policyId,
      tenantId,
      courseId,
      moduleId,
      combinator: 'any',
      createdAt: now,
      updatedAt: now,
    });
    expect(policy.combinator).toBe('any');
  });

  it('parses an override with grantedBy', () => {
    const override = ModuleReleaseOverride.parse({
      id: overrideId,
      tenantId,
      courseId,
      moduleId,
      studentId,
      state: 'unlocked',
      reason: 'extension granted for medical leave',
      grantedByUserId,
      grantedAt: now,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(override.state).toBe('unlocked');
  });

  it('parses a release decision', () => {
    const decision = ModuleReleaseDecision.parse({
      moduleId,
      targetType: 'module',
      targetId: null,
      state: 'released',
      evaluatedAt: now,
      sourceCombinator: 'all',
      ruleResults: [
        {
          ruleId,
          ruleType: 'date_after',
          passed: true,
          summary: 'Module open since 2026-01-01',
        },
      ],
      blockers: [],
      override: null,
    });
    expect(decision.state).toBe('released');
  });

  it('parses an item-scoped release decision', () => {
    const decision = ModuleReleaseDecision.parse({
      moduleId,
      targetType: 'assignment',
      targetId: AssignmentId.parse(assignmentId),
      state: 'locked',
      evaluatedAt: now,
      sourceCombinator: 'all',
      ruleResults: [],
      blockers: [],
      override: null,
    });
    expect(decision.targetType).toBe('assignment');
    expect(decision.targetId).toBe(assignmentId);
  });

  it('rejects item-scoped release decisions without an item target', () => {
    expect(() =>
      ModuleReleaseDecision.parse({
        moduleId,
        targetType: 'course_resource',
        targetId: null,
        state: 'locked',
        evaluatedAt: now,
        sourceCombinator: 'all',
        ruleResults: [],
        blockers: [],
        override: null,
      }),
    ).toThrow();
  });

  it('rejects negative position on a rule', () => {
    expect(() =>
      ModuleReleaseRule.parse({
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        ruleType: 'manual_unlock',
        config: { defaultLocked: true },
        position: -1,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });
});
