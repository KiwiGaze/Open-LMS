import { CompletionRequirement } from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { completionProgress, completionRequirement } from '../src/db/schema/completion.ts';
import { completePassQuizRequirementsForAttempt } from '../src/quizzes/completion.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const requirementId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const noThresholdRequirementId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const progressId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const now = new Date('2026-05-14T10:00:00Z');

const createRequirement = (input: {
  id: string;
  minScorePercent: number | null;
}): CompletionRequirement =>
  CompletionRequirement.parse({
    id: input.id,
    tenantId,
    courseId,
    moduleId: null,
    title: 'Pass Quiz 1',
    description: null,
    requirementType: 'pass_quiz',
    targetType: 'quiz',
    targetId: quizId,
    minScorePercent: input.minScorePercent,
    status: 'active',
    required: true,
    position: 0,
    createdAt: now,
    updatedAt: now,
  });

type InsertedProgress = {
  tenantId: string;
  requirementId: string;
  studentId: string;
  status: string;
  completedAt: Date | null;
};

const createWorkflowDb = (
  requirements: CompletionRequirement[],
  insertedProgress: InsertedProgress[],
): Database => {
  const tx = {
    insert: vi.fn((table: unknown) => {
      if (table !== completionProgress) {
        throw new Error('Unexpected insert table.');
      }

      return {
        values: (value: InsertedProgress) => {
          insertedProgress.push(value);
          return {
            onConflictDoUpdate: () => ({
              returning: async () => [
                {
                  id: progressId,
                  tenantId,
                  requirementId: value.requirementId,
                  studentId,
                  status: 'completed',
                  completedAt: value.completedAt,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            }),
          };
        },
      };
    }),
    select: vi.fn(() => ({
      from: (table: unknown) => {
        if (table !== completionRequirement) {
          throw new Error('Unexpected select table.');
        }

        return {
          where: () => ({
            orderBy: async () => requirements,
          }),
        };
      },
    })),
  };

  return tx as unknown as Database;
};

describe('quiz completion workflow', () => {
  it('completes active pass-quiz requirements when the scored attempt meets thresholds', async () => {
    const insertedProgress: InsertedProgress[] = [];

    const completed = await completePassQuizRequirementsForAttempt(
      createWorkflowDb(
        [
          createRequirement({ id: requirementId, minScorePercent: 70 }),
          createRequirement({ id: noThresholdRequirementId, minScorePercent: null }),
        ],
        insertedProgress,
      ),
      {
        tenantId,
        courseId,
        quizId,
        studentId,
        score: 8,
        maxScore: 10,
        completedAt: now,
      },
      now,
    );

    expect(completed).toHaveLength(2);
    expect(insertedProgress).toEqual([
      expect.objectContaining({
        tenantId,
        requirementId,
        studentId,
        status: 'completed',
        completedAt: now,
      }),
      expect.objectContaining({
        tenantId,
        requirementId: noThresholdRequirementId,
        studentId,
        status: 'completed',
        completedAt: now,
      }),
    ]);
  });

  it('does not complete pass-quiz requirements when the scored attempt is below threshold', async () => {
    const insertedProgress: InsertedProgress[] = [];

    const completed = await completePassQuizRequirementsForAttempt(
      createWorkflowDb(
        [createRequirement({ id: requirementId, minScorePercent: 70 })],
        insertedProgress,
      ),
      {
        tenantId,
        courseId,
        quizId,
        studentId,
        score: 6,
        maxScore: 10,
        completedAt: now,
      },
      now,
    );

    expect(completed).toEqual([]);
    expect(insertedProgress).toEqual([]);
  });
});
