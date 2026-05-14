import { CompletionRequirement } from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { completionProgress, completionRequirement } from '../src/db/schema/completion.ts';
import { completeSubmitAssignmentRequirementsForSubmission } from '../src/submissions/completion.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE92';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE93';
const requirementId = '01J9QW7B6N5W2YH3D3A1V0KE94';
const progressId = '01J9QW7B6N5W2YH3D3A1V0KE95';
const now = new Date('2026-05-14T11:00:00Z');

const requirement = CompletionRequirement.parse({
  id: requirementId,
  tenantId,
  courseId,
  moduleId: null,
  title: 'Submit Essay 1',
  description: null,
  requirementType: 'submit_assignment',
  targetType: 'assignment',
  targetId: assignmentId,
  minScorePercent: null,
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

describe('submission completion workflow', () => {
  it('completes active submit-assignment requirements for the submitting learner', async () => {
    const insertedProgress: InsertedProgress[] = [];

    const completed = await completeSubmitAssignmentRequirementsForSubmission(
      createWorkflowDb([requirement], insertedProgress),
      {
        tenantId,
        courseId,
        assignmentId,
        studentId,
        completedAt: now,
      },
      now,
    );

    expect(completed).toHaveLength(1);
    expect(insertedProgress).toEqual([
      expect.objectContaining({
        tenantId,
        requirementId,
        studentId,
        status: 'completed',
        completedAt: now,
      }),
    ]);
  });
});
