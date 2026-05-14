import { AssignmentOverride } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  filterAssignmentOverridesForLearner,
  resolveEffectiveAssignmentSchedule,
} from '../src/assignments/effective-schedule.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const userId = '01J9QW7B6N5W2YH3D3A1V0KE33';
const otherUserId = '01J9QW7B6N5W2YH3D3A1V0KE34';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE35';
const otherGroupId = '01J9QW7B6N5W2YH3D3A1V0KE36';
const sectionId = '01J9QW7B6N5W2YH3D3A1V0KE37';
const otherSectionId = '01J9QW7B6N5W2YH3D3A1V0KE38';
const now = new Date('2026-05-10T00:00:00.000Z');

const emptyContext = { userId, groupIds: [] as string[], sectionIds: [] as string[] };

const buildOverride = (
  overrides: Partial<{
    id: string;
    targetType: 'user' | 'group' | 'section';
    targetId: string;
    opensAt: Date | null;
    dueAt: Date | null;
    closesAt: Date | null;
    status: 'active' | 'archived';
  }> = {},
): AssignmentOverride =>
  AssignmentOverride.parse({
    id: overrides.id ?? '01J9QW7B6N5W2YH3D3A1V0KE40',
    tenantId,
    assignmentId,
    targetType: overrides.targetType ?? 'user',
    targetId: overrides.targetId ?? userId,
    opensAt: overrides.opensAt ?? null,
    dueAt: overrides.dueAt ?? null,
    closesAt: overrides.closesAt ?? null,
    status: overrides.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  });

describe('filterAssignmentOverridesForLearner', () => {
  it('includes user overrides that target the learner', () => {
    const override = buildOverride({ targetType: 'user', targetId: userId });
    expect(filterAssignmentOverridesForLearner([override], emptyContext)).toEqual([override]);
  });

  it('excludes user overrides for other learners', () => {
    const override = buildOverride({ targetType: 'user', targetId: otherUserId });
    expect(filterAssignmentOverridesForLearner([override], emptyContext)).toEqual([]);
  });

  it('includes group overrides when the learner is in the targeted group', () => {
    const override = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE41',
      targetType: 'group',
      targetId: groupId,
    });
    expect(
      filterAssignmentOverridesForLearner([override], { ...emptyContext, groupIds: [groupId] }),
    ).toEqual([override]);
  });

  it('excludes group overrides for groups the learner does not belong to', () => {
    const override = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE42',
      targetType: 'group',
      targetId: otherGroupId,
    });
    expect(
      filterAssignmentOverridesForLearner([override], { ...emptyContext, groupIds: [groupId] }),
    ).toEqual([]);
  });

  it('includes section overrides when the learner is in the targeted section', () => {
    const override = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE4A',
      targetType: 'section',
      targetId: sectionId,
    });
    expect(
      filterAssignmentOverridesForLearner([override], {
        ...emptyContext,
        sectionIds: [sectionId],
      }),
    ).toEqual([override]);
  });

  it('excludes section overrides for sections the learner is not in', () => {
    const override = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE4B',
      targetType: 'section',
      targetId: otherSectionId,
    });
    expect(
      filterAssignmentOverridesForLearner([override], {
        ...emptyContext,
        sectionIds: [sectionId],
      }),
    ).toEqual([]);
  });

  it('drops archived overrides regardless of target', () => {
    const override = buildOverride({ targetType: 'user', targetId: userId, status: 'archived' });
    expect(filterAssignmentOverridesForLearner([override], emptyContext)).toEqual([]);
  });
});

describe('resolveEffectiveAssignmentSchedule', () => {
  const baseDueAt = new Date('2026-05-15T23:59:00.000Z');

  it('returns base dueAt when there are no overrides', () => {
    expect(resolveEffectiveAssignmentSchedule({ baseDueAt, overrides: [] })).toEqual({
      opensAt: null,
      dueAt: baseDueAt,
      closesAt: null,
    });
  });

  it('uses the latest override dueAt when overrides have due dates', () => {
    const earlier = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE43',
      dueAt: new Date('2026-05-12T00:00:00.000Z'),
    });
    const later = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE44',
      dueAt: new Date('2026-05-20T00:00:00.000Z'),
    });

    expect(
      resolveEffectiveAssignmentSchedule({ baseDueAt, overrides: [earlier, later] }).dueAt,
    ).toEqual(new Date('2026-05-20T00:00:00.000Z'));
  });

  it('falls back to base dueAt when no override supplies one', () => {
    const opensOnly = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE45',
      opensAt: new Date('2026-05-08T00:00:00.000Z'),
    });

    expect(resolveEffectiveAssignmentSchedule({ baseDueAt, overrides: [opensOnly] }).dueAt).toEqual(
      baseDueAt,
    );
  });

  it('picks the earliest opensAt across overrides', () => {
    const early = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE46',
      opensAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    const late = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE47',
      opensAt: new Date('2026-05-05T00:00:00.000Z'),
    });

    expect(
      resolveEffectiveAssignmentSchedule({ baseDueAt, overrides: [late, early] }).opensAt,
    ).toEqual(new Date('2026-05-01T00:00:00.000Z'));
  });

  it('picks the latest closesAt across overrides', () => {
    const earlier = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE48',
      closesAt: new Date('2026-05-20T00:00:00.000Z'),
    });
    const later = buildOverride({
      id: '01J9QW7B6N5W2YH3D3A1V0KE49',
      closesAt: new Date('2026-05-25T00:00:00.000Z'),
    });

    expect(
      resolveEffectiveAssignmentSchedule({ baseDueAt, overrides: [earlier, later] }).closesAt,
    ).toEqual(new Date('2026-05-25T00:00:00.000Z'));
  });

  it('handles a base assignment with no due date and no overrides', () => {
    expect(resolveEffectiveAssignmentSchedule({ baseDueAt: null, overrides: [] }).dueAt).toBeNull();
  });
});
