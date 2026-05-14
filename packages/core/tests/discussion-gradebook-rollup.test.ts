import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import { listDiscussionGradebookEntriesForCourse } from '../src/discussions/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE60';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE61';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE62';
const postId = '01J9QW7B6N5W2YH3D3A1V0KE63';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE64';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KE65';
const now = new Date('2026-05-12T10:00:00Z');

const sampleRow = {
  gradeId,
  tenantId,
  courseId,
  topicId,
  topicTitle: 'Week 1 evidence workshop',
  postId,
  studentId,
  score: 9,
  maxScore: 10,
  status: 'published' as const,
  comment: 'Strong analysis.',
  gradedAt: now,
};

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: async () => rows,
          }),
        }),
      }),
    }),
  }) as unknown as Database;

describe('listDiscussionGradebookEntriesForCourse', () => {
  it('shapes rollup rows as DiscussionGradebookEntry contract', async () => {
    const db = createSelectOnlyDb([sampleRow]);
    const result = await listDiscussionGradebookEntriesForCourse(db, { tenantId, courseId });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: `discussion_gradebook_entry:${gradeId}`,
      topicTitle: 'Week 1 evidence workshop',
      score: 9,
      maxScore: 10,
      status: 'published',
    });
  });

  it('returns empty array when no grades exist', async () => {
    const db = createSelectOnlyDb([]);
    const result = await listDiscussionGradebookEntriesForCourse(db, { tenantId, courseId });
    expect(result).toEqual([]);
  });

  it('passes through filtering inputs without error', async () => {
    const db = createSelectOnlyDb([sampleRow]);
    const result = await listDiscussionGradebookEntriesForCourse(db, {
      tenantId,
      courseId,
      statuses: ['published', 'revised'],
      studentId,
    });
    expect(result).toHaveLength(1);
  });
});
