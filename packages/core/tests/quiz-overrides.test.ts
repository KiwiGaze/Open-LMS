import { QuizOverride } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  filterQuizOverridesForLearner,
  resolveEffectiveQuizSettings,
} from '../src/quizzes/overrides.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEB0';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KEB1';
const userId = '01J9QW7B6N5W2YH3D3A1V0KEB2';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KEB3';
const sectionId = '01J9QW7B6N5W2YH3D3A1V0KEB4';
const now = new Date('2026-05-10T00:00:00.000Z');

const override = (
  overrides: Partial<{
    id: string;
    targetType: 'user' | 'group' | 'section';
    targetId: string;
    opensAt: Date | null;
    closesAt: Date | null;
    timeLimitMinutes: number | null;
    maxAttempts: number | null;
    status: 'active' | 'archived';
  }> = {},
) =>
  QuizOverride.parse({
    id: overrides.id ?? '01J9QW7B6N5W2YH3D3A1V0KEB5',
    tenantId,
    quizId,
    targetType: overrides.targetType ?? 'user',
    targetId: overrides.targetId ?? userId,
    opensAt: overrides.opensAt ?? null,
    closesAt: overrides.closesAt ?? null,
    timeLimitMinutes: overrides.timeLimitMinutes ?? null,
    maxAttempts: overrides.maxAttempts ?? null,
    status: overrides.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  });

describe('filterQuizOverridesForLearner', () => {
  it('keeps active user, group, and section overrides for a learner', () => {
    const userOverride = override({ targetType: 'user', targetId: userId });
    const groupOverride = override({
      id: '01J9QW7B6N5W2YH3D3A1V0KEB6',
      targetType: 'group',
      targetId: groupId,
    });
    const sectionOverride = override({
      id: '01J9QW7B6N5W2YH3D3A1V0KEB7',
      targetType: 'section',
      targetId: sectionId,
    });

    expect(
      filterQuizOverridesForLearner(
        [
          userOverride,
          groupOverride,
          sectionOverride,
          override({
            id: '01J9QW7B6N5W2YH3D3A1V0KEB8',
            targetType: 'user',
            targetId: '01J9QW7B6N5W2YH3D3A1V0KEB9',
          }),
          override({
            id: '01J9QW7B6N5W2YH3D3A1V0KEBA',
            targetType: 'group',
            targetId: groupId,
            status: 'archived',
          }),
        ],
        { userId, groupIds: [groupId], sectionIds: [sectionId] },
      ),
    ).toEqual([userOverride, groupOverride, sectionOverride]);
  });
});

describe('resolveEffectiveQuizSettings', () => {
  it('uses the most permissive availability, time limit, and attempts from active overrides', () => {
    expect(
      resolveEffectiveQuizSettings({
        quizId,
        baseOpensAt: new Date('2026-05-12T00:00:00.000Z'),
        baseClosesAt: new Date('2026-05-15T00:00:00.000Z'),
        baseTimeLimitMinutes: 30,
        baseMaxAttempts: 1,
        overrides: [
          override({
            opensAt: new Date('2026-05-11T00:00:00.000Z'),
            closesAt: new Date('2026-05-18T00:00:00.000Z'),
            timeLimitMinutes: 45,
            maxAttempts: 2,
          }),
          override({
            id: '01J9QW7B6N5W2YH3D3A1V0KEBB',
            opensAt: new Date('2026-05-13T00:00:00.000Z'),
            closesAt: new Date('2026-05-20T00:00:00.000Z'),
            timeLimitMinutes: 60,
            maxAttempts: 3,
          }),
        ],
      }),
    ).toEqual({
      quizId,
      opensAt: new Date('2026-05-11T00:00:00.000Z'),
      closesAt: new Date('2026-05-20T00:00:00.000Z'),
      timeLimitMinutes: 60,
      maxAttempts: 3,
    });
  });

  it('keeps an unlimited base time limit unlimited', () => {
    expect(
      resolveEffectiveQuizSettings({
        quizId,
        baseOpensAt: null,
        baseClosesAt: null,
        baseTimeLimitMinutes: null,
        baseMaxAttempts: 1,
        overrides: [override({ timeLimitMinutes: 45, maxAttempts: 2 })],
      }).timeLimitMinutes,
    ).toBeNull();
  });

  it('does not make unrestricted base availability restrictive', () => {
    expect(
      resolveEffectiveQuizSettings({
        quizId,
        baseOpensAt: null,
        baseClosesAt: null,
        baseTimeLimitMinutes: 30,
        baseMaxAttempts: 1,
        overrides: [
          override({
            opensAt: new Date('2026-05-11T00:00:00.000Z'),
            closesAt: new Date('2026-05-18T00:00:00.000Z'),
          }),
        ],
      }),
    ).toMatchObject({
      opensAt: null,
      closesAt: null,
    });
  });
});
