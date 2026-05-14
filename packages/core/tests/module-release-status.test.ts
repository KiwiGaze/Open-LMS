import type {
  CourseId,
  CourseModule,
  CourseModuleId,
  CourseModuleReleaseRuleId,
  LearningObjectiveId,
  LearningObjectiveMastery,
  ModuleReleaseOverride,
  ModuleReleaseRule,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  type ModuleReleaseStatusDependencies,
  evaluateCourseReleases,
} from '../src/module-release/release-status.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as UserId;
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as CourseModuleId;
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2Y' as LearningObjectiveId;
const now = new Date('2026-05-12T10:00:00Z');

const moduleRow: CourseModule = {
  id: moduleId,
  tenantId,
  courseId,
  title: 'Module',
  summary: null,
  visibility: 'published',
  accessPolicy: 'course_member',
  version: 1,
  position: 0,
  learningObjectiveIds: [objectiveId],
  createdAt: now,
  updatedAt: now,
};

const baseDependencies: ModuleReleaseStatusDependencies = {
  listCourseModules: vi.fn().mockResolvedValue([moduleRow]),
  listReleaseRulesForCourse: vi.fn().mockResolvedValue([]),
  getReleasePoliciesForCourse: vi.fn().mockResolvedValue(new Map()),
  listOverridesForStudent: vi.fn().mockResolvedValue(new Map()),
  listMasteryForStudent: vi.fn().mockResolvedValue([]),
};

describe('evaluateCourseReleases', () => {
  it('returns "released" decisions for every module when there are no rules', async () => {
    const decisions = await evaluateCourseReleases(baseDependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.state).toBe('released');
  });

  it('uses an active override even if rules exist', async () => {
    const override: ModuleReleaseOverride = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE30' as ModuleReleaseOverride['id'],
      tenantId,
      courseId,
      moduleId,
      studentId,
      state: 'unlocked',
      reason: 'extension',
      grantedByUserId: null,
      grantedAt: now,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const rule = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE31' as CourseModuleReleaseRuleId,
      tenantId,
      courseId,
      moduleId,
      ruleType: 'date_after',
      config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    } as ModuleReleaseRule;
    const dependencies: ModuleReleaseStatusDependencies = {
      ...baseDependencies,
      listReleaseRulesForCourse: vi.fn().mockResolvedValue([rule]),
      listOverridesForStudent: vi.fn().mockResolvedValue(new Map([[moduleId, override]])),
    };
    const decisions = await evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    expect(decisions[0]?.state).toBe('released');
    expect(decisions[0]?.override?.state).toBe('unlocked');
  });

  it('keeps item-scoped rules out of module decisions and returns item decisions', async () => {
    const rule = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE36' as CourseModuleReleaseRuleId,
      tenantId,
      courseId,
      moduleId,
      targetType: 'assignment',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE37',
      ruleType: 'date_after',
      config: { releaseAt: new Date('2099-01-01T00:00:00Z') },
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    } as ModuleReleaseRule;
    const dependencies: ModuleReleaseStatusDependencies = {
      ...baseDependencies,
      listReleaseRulesForCourse: vi.fn().mockResolvedValue([rule]),
    };
    const decisions = await evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    const moduleDecision = decisions.find(
      (decision) => decision.moduleId === moduleId && decision.targetType === 'module',
    );
    const itemDecision = decisions.find(
      (decision) => decision.targetType === 'assignment' && decision.targetId === rule.targetId,
    );

    expect(moduleDecision?.state).toBe('released');
    expect(moduleDecision?.ruleResults).toEqual([]);
    expect(itemDecision?.state).toBe('locked');
    expect(itemDecision?.ruleResults).toHaveLength(1);
  });

  it('uses module objectives to evaluate prerequisite_modules rule', async () => {
    const otherModuleId = '01J9QW7B6N5W2YH3D3A1V0KE32' as CourseModuleId;
    const otherObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE33' as LearningObjectiveId;
    const mastery: LearningObjectiveMastery = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE34' as LearningObjectiveMastery['id'],
      tenantId,
      courseId,
      learningObjectiveId: otherObjectiveId,
      studentId,
      status: 'proficient',
      score: 100,
      maxScore: 100,
      lastAssessedAt: now,
      evidenceCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    const rule = {
      id: '01J9QW7B6N5W2YH3D3A1V0KE35' as CourseModuleReleaseRuleId,
      tenantId,
      courseId,
      moduleId,
      ruleType: 'prerequisite_modules',
      config: { moduleIds: [otherModuleId], requireAll: true },
      position: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    } as ModuleReleaseRule;
    const dependencies: ModuleReleaseStatusDependencies = {
      ...baseDependencies,
      listCourseModules: vi.fn().mockResolvedValue([
        {
          ...moduleRow,
          id: otherModuleId,
          title: 'Prereq',
          learningObjectiveIds: [otherObjectiveId],
          position: 0,
        },
        { ...moduleRow, position: 1 },
      ]),
      listReleaseRulesForCourse: vi.fn().mockResolvedValue([rule]),
      listMasteryForStudent: vi.fn().mockResolvedValue([mastery]),
    };
    const decisions = await evaluateCourseReleases(dependencies, {
      tenantId,
      courseId,
      studentId,
      now,
    });
    const gated = decisions.find((decision) => decision.moduleId === moduleId);
    expect(gated?.state).toBe('released');
  });
});
