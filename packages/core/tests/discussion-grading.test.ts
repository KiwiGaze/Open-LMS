import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  getDiscussionPostGrade,
  listDiscussionPostGradesForTopic,
  upsertDiscussionPostGrade,
} from '../src/discussions/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const topicId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const postId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const gradedById = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';
const now = new Date('2026-05-12T10:00:00Z');

const gradeRow = {
  id: gradeId,
  tenantId,
  topicId,
  postId,
  studentId,
  score: 9,
  maxScore: 10,
  status: 'draft' as const,
  comment: null,
  gradedByUserId: gradedById,
  createdAt: now,
  updatedAt: now,
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

describe('discussion post grading repository', () => {
  it('upserts a discussion post grade', async () => {
    const db = createUpsertReturningDb(gradeRow);
    const result = await upsertDiscussionPostGrade(db, {
      tenantId,
      topicId,
      postId,
      studentId,
      score: 9,
      maxScore: 10,
      status: 'draft',
      comment: null,
      gradedByUserId: gradedById,
    });
    expect(result.score).toBe(9);
    expect(result.maxScore).toBe(10);
    expect(result.status).toBe('draft');
  });

  it('lists grades for a topic', async () => {
    const db = createSelectOrderByDb([gradeRow]);
    const grades = await listDiscussionPostGradesForTopic(db, { tenantId, topicId });
    expect(grades).toHaveLength(1);
    expect(grades[0]?.postId).toBe(postId);
  });

  it('returns null when grade is missing', async () => {
    const db = createSelectOrderByDb([]);
    const grade = await getDiscussionPostGrade(db, { tenantId, postId });
    expect(grade).toBeNull();
  });

  it('rejects score exceeding maxScore at parse time', async () => {
    const db = createUpsertReturningDb({ ...gradeRow, score: 100 });
    await expect(
      upsertDiscussionPostGrade(db, {
        tenantId,
        topicId,
        postId,
        studentId,
        score: 100,
        maxScore: 10,
        status: 'draft',
        comment: null,
        gradedByUserId: gradedById,
      }),
    ).rejects.toThrow();
  });
});
