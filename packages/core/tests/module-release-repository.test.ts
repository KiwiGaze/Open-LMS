import type {
  CourseId,
  CourseModuleId,
  CourseModuleReleaseOverrideId,
  CourseModuleReleasePolicyId,
  CourseModuleReleaseRuleId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  createReleaseRule,
  deleteReleaseRule,
  getReleasePolicy,
  listReleaseOverridesForModule,
  listReleaseRulesForCourse,
  listReleaseRulesForModule,
  removeReleaseOverride,
  updateReleaseRule,
  upsertReleaseOverride,
  upsertReleasePolicy,
} from '../src/module-release/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as CourseModuleId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as UserId;
const grantedByUserId = '01J9QW7B6N5W2YH3D3A1V0KE2Y' as UserId;
const ruleIdValue = '01J9QW7B6N5W2YH3D3A1V0KE2Z' as CourseModuleReleaseRuleId;
const policyIdValue = '01J9QW7B6N5W2YH3D3A1V0KE30' as CourseModuleReleasePolicyId;
const overrideIdValue = '01J9QW7B6N5W2YH3D3A1V0KE31' as CourseModuleReleaseOverrideId;

const ruleRow = {
  id: ruleIdValue,
  tenantId,
  courseId,
  moduleId,
  targetType: 'module' as const,
  targetId: null,
  ruleType: 'date_after' as const,
  config: { releaseAt: new Date('2026-06-01T00:00:00Z') },
  position: 0,
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const policyRow = {
  id: policyIdValue,
  tenantId,
  courseId,
  moduleId,
  combinator: 'all' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const overrideRow = {
  id: overrideIdValue,
  tenantId,
  courseId,
  moduleId,
  studentId,
  state: 'unlocked' as const,
  reason: 'extension',
  grantedByUserId,
  grantedAt: new Date(),
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createInsertReturningDb = <T>(stored: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        returning: async () => [stored],
      }),
    }),
  }) as unknown as Database;

const createInsertCaptureDb = <T>(
  stored: T,
): { db: Database; insertedValues: Record<string, unknown>[] } => {
  const insertedValues: Record<string, unknown>[] = [];
  return {
    db: {
      insert: () => ({
        values: (value: Record<string, unknown>) => {
          insertedValues.push(value);
          return {
            returning: async () => [stored],
          };
        },
      }),
    } as unknown as Database,
    insertedValues,
  };
};

const createUpsertReturningDb = <T>(stored: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [stored],
        }),
      }),
    }),
  }) as unknown as Database;

const createSelectOrderByDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createSelectLimitDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createUpdateReturningDb = <T>(
  stored: T,
): { db: Database; updateSpy: ReturnType<typeof vi.fn> } => {
  const updateSpy = vi.fn().mockReturnValue({
    set: () => ({
      where: () => ({
        returning: async () => [stored],
      }),
    }),
  });
  return {
    db: { update: updateSpy } as unknown as Database,
    updateSpy,
  };
};

const createDeleteDb = (
  deletedRows: Array<{ id: string }>,
): { db: Database; deleteSpy: ReturnType<typeof vi.fn> } => {
  const deleteSpy = vi.fn().mockReturnValue({
    where: () => ({
      returning: async () => deletedRows,
    }),
  });
  return {
    db: { delete: deleteSpy } as unknown as Database,
    deleteSpy,
  };
};

describe('module release repository', () => {
  it('creates a release rule', async () => {
    const db = createInsertReturningDb(ruleRow);
    const result = await createReleaseRule(db, {
      tenantId,
      courseId,
      moduleId,
      targetType: 'module',
      targetId: null,
      ruleType: 'date_after',
      config: { releaseAt: new Date('2026-06-01T00:00:00Z') },
      position: 0,
      status: 'active',
    });
    expect(result.ruleType).toBe('date_after');
  });

  it('creates an item-scoped release rule', async () => {
    const { db, insertedValues } = createInsertCaptureDb({
      ...ruleRow,
      targetType: 'course_resource' as const,
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE32',
    });
    const result = await createReleaseRule(db, {
      tenantId,
      courseId,
      moduleId,
      targetType: 'course_resource',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE32',
      ruleType: 'date_after',
      config: { releaseAt: new Date('2026-06-01T00:00:00Z') },
      position: 0,
      status: 'active',
    });

    expect(result.targetType).toBe('course_resource');
    expect(insertedValues[0]).toMatchObject({
      targetType: 'course_resource',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE32',
    });
  });

  it('lists release rules for a module ordered by position', async () => {
    const db = createSelectOrderByDb([ruleRow]);
    const result = await listReleaseRulesForModule(db, { tenantId, moduleId });
    expect(result).toHaveLength(1);
  });

  it('lists release rules for a module item', async () => {
    const db = createSelectOrderByDb([
      {
        ...ruleRow,
        targetType: 'assignment' as const,
        targetId: '01J9QW7B6N5W2YH3D3A1V0KE33',
      },
    ]);
    const result = await listReleaseRulesForModule(db, {
      tenantId,
      moduleId,
      targetType: 'assignment',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE33',
    });

    expect(result[0]?.targetType).toBe('assignment');
    expect(result[0]?.targetId).toBe('01J9QW7B6N5W2YH3D3A1V0KE33');
  });

  it('lists release rules across a course', async () => {
    const db = createSelectOrderByDb([ruleRow]);
    const result = await listReleaseRulesForCourse(db, { tenantId, courseId });
    expect(result).toHaveLength(1);
  });

  it('updates a release rule', async () => {
    const { db } = createUpdateReturningDb({ ...ruleRow, position: 2 });
    const result = await updateReleaseRule(db, {
      tenantId,
      courseId,
      moduleId,
      ruleId: ruleIdValue,
      targetType: 'module',
      targetId: null,
      ruleType: 'date_after',
      config: { releaseAt: new Date('2026-06-02T00:00:00Z') },
      position: 2,
      status: 'active',
    });
    expect(result.position).toBe(2);
  });

  it('rejects invalid update input before writing', async () => {
    const { db, updateSpy } = createUpdateReturningDb(ruleRow);

    await expect(
      updateReleaseRule(db, {
        tenantId,
        courseId,
        moduleId,
        ruleId: ruleIdValue,
        targetType: 'course_resource',
        targetId: '',
        ruleType: 'date_after',
        config: { releaseAt: new Date('2026-06-02T00:00:00Z') },
        position: 2,
        status: 'active',
      }),
    ).rejects.toThrow();

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('deletes a release rule', async () => {
    const { db, deleteSpy } = createDeleteDb([{ id: ruleIdValue }]);
    const deleted = await deleteReleaseRule(db, { tenantId, courseId, moduleId, ruleId: ruleIdValue });
    expect(deleteSpy).toHaveBeenCalled();
    expect(deleted).toBe(true);
  });

  it('returns false when deleting a missing release rule', async () => {
    const { db } = createDeleteDb([]);
    const deleted = await deleteReleaseRule(db, { tenantId, courseId, moduleId, ruleId: ruleIdValue });
    expect(deleted).toBe(false);
  });

  it('upserts a release policy', async () => {
    const db = createUpsertReturningDb(policyRow);
    const result = await upsertReleasePolicy(db, {
      tenantId,
      courseId,
      moduleId,
      combinator: 'all',
    });
    expect(result.combinator).toBe('all');
  });

  it('returns null when policy is missing', async () => {
    const db = createSelectLimitDb([]);
    const result = await getReleasePolicy(db, { tenantId, moduleId });
    expect(result).toBeNull();
  });

  it('upserts a release override', async () => {
    const db = createUpsertReturningDb(overrideRow);
    const result = await upsertReleaseOverride(db, {
      tenantId,
      courseId,
      moduleId,
      studentId,
      state: 'unlocked',
      reason: 'extension',
      grantedByUserId,
      expiresAt: null,
    });
    expect(result.state).toBe('unlocked');
  });

  it('lists release overrides for a module', async () => {
    const db = createSelectOrderByDb([overrideRow]);
    const result = await listReleaseOverridesForModule(db, { tenantId, moduleId });
    expect(result).toHaveLength(1);
  });

  it('removes a release override', async () => {
    const { db, deleteSpy } = createDeleteDb([]);
    await removeReleaseOverride(db, { tenantId, courseId, moduleId, studentId });
    expect(deleteSpy).toHaveBeenCalled();
  });
});
