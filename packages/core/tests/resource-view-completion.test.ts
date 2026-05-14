import { CompletionRequirement, CourseResource, CourseResourceViewEvent } from '@openlms/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { completionProgress } from '../src/db/schema/completion.ts';
import { courseResourceViewEvent } from '../src/db/schema/resource-view.ts';
import { recordResourceViewWithCompletion } from '../src/resource-views/completion.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const resourceId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const viewerId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const eventId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const requirementId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const progressId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const now = new Date('2026-05-12T10:00:00Z');

const eventRow = CourseResourceViewEvent.parse({
  id: eventId,
  tenantId,
  courseId,
  resourceId,
  viewerId,
  viewedAt: now,
  createdAt: now,
});

const resourceRow = CourseResource.parse({
  id: resourceId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  resourceType: 'reading_material',
  title: 'Argument primer',
  body: 'Read this before writing.',
  sourceUri: null,
  visibility: 'published',
  accessPolicy: 'course_member',
  version: 1,
  position: 0,
  learningObjectiveIds: [],
  createdAt: now,
  updatedAt: now,
});

const requirementRow = CompletionRequirement.parse({
  id: requirementId,
  tenantId,
  courseId,
  moduleId: null,
  title: 'Read the primer',
  description: null,
  requirementType: 'view_resource',
  targetType: 'course_resource',
  targetId: resourceId,
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
  insertedProgress: InsertedProgress[],
  options: { resourceExists?: boolean } = {},
): Database => {
  const resourceRows = options.resourceExists === false ? [] : [resourceRow];
  const tx = {
    insert: vi.fn((table: unknown) => {
      if (table === courseResourceViewEvent) {
        return {
          values: () => ({
            returning: async () => [eventRow],
          }),
        };
      }

      if (table === completionProgress) {
        return {
          values: (value: InsertedProgress) => {
            insertedProgress.push(value);
            return {
              onConflictDoUpdate: () => ({
                returning: async () => [
                  {
                    id: progressId,
                    tenantId,
                    requirementId,
                    studentId: viewerId,
                    status: 'completed',
                    completedAt: now,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
              }),
            };
          },
        };
      }

      throw new Error('Unexpected insert table.');
    }),
    select: vi.fn(() => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table === courseResourceViewEvent) {
              throw new Error('Resource views should not be selected in this workflow.');
            }
            return resourceRows;
          },
          orderBy: async () => [requirementRow],
        }),
      }),
    })),
  };

  return {
    transaction: async <T>(callback: (transactionDb: Database) => Promise<T>): Promise<T> =>
      callback(tx as unknown as Database),
  } as unknown as Database;
};

describe('resource view completion workflow', () => {
  it('records the resource view and completes matching active view-resource requirements', async () => {
    const insertedProgress: InsertedProgress[] = [];

    await expect(
      recordResourceViewWithCompletion(
        createWorkflowDb(insertedProgress),
        {
          tenantId,
          courseId,
          resourceId,
          viewerId,
          viewedAt: now,
        },
        now,
      ),
    ).resolves.toEqual(eventRow);

    expect(insertedProgress).toEqual([
      expect.objectContaining({
        tenantId,
        requirementId,
        studentId: viewerId,
        status: 'completed',
        completedAt: now,
      }),
    ]);
  });

  it('can record a resource view without completing requirements', async () => {
    const insertedProgress: InsertedProgress[] = [];

    await expect(
      recordResourceViewWithCompletion(
        createWorkflowDb(insertedProgress),
        {
          tenantId,
          courseId,
          resourceId,
          viewerId,
          viewedAt: now,
          completeRequirements: false,
        },
        now,
      ),
    ).resolves.toEqual(eventRow);

    expect(insertedProgress).toEqual([]);
  });

  it('rejects a resource that is not in the course before recording progress', async () => {
    const insertedProgress: InsertedProgress[] = [];

    await expect(
      recordResourceViewWithCompletion(
        createWorkflowDb(insertedProgress, { resourceExists: false }),
        {
          tenantId,
          courseId,
          resourceId,
          viewerId,
          viewedAt: now,
        },
        now,
      ),
    ).rejects.toThrow('Course resource was not found in this course.');

    expect(insertedProgress).toEqual([]);
  });
});
