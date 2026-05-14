import { describe, expect, it } from 'vitest';
import type { Database } from '../src/db/client.ts';
import {
  createScormPackage,
  listScormExtractedContentForPackage,
  listScormPackagesForCourse,
  upsertScormAttempt,
  upsertScormExtractedContent,
} from '../src/scorm/repository.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const packageId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE73';
const attemptId = '01J9QW7B6N5W2YH3D3A1V0KE74';
const extractedContentId = '01J9QW7B6N5W2YH3D3A1V0KE75';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE76';
const now = new Date('2026-05-12T10:00:00Z');

const samplePackageRow = {
  id: packageId,
  tenantId,
  courseId,
  title: 'Intro to Evidence',
  scormVersion: '1.2' as const,
  launchUrl: 'https://cdn.example.com/scorm/index.html',
  manifest: { schemaVersion: '1.2' },
  status: 'published' as const,
  createdAt: now,
  updatedAt: now,
};

const sampleAttemptRow = {
  id: attemptId,
  tenantId,
  scormPackageId: packageId,
  studentId,
  completionStatus: 'incomplete' as const,
  successStatus: 'unknown' as const,
  scoreScaled: 0.4,
  totalTimeSeconds: 360,
  suspendData: 'state=lesson1',
  lastVisitedAt: now,
  createdAt: now,
  updatedAt: now,
};

const sampleExtractedContentRow = {
  id: extractedContentId,
  tenantId,
  courseId,
  scormPackageId: packageId,
  sourceKey: 'sco:introduction',
  title: 'Introduction SCO',
  body: 'Evidence must be introduced, cited, and explained.',
  language: 'en-US',
  learningObjectiveIds: [learningObjectiveId],
  sourceVersion: 'manifest-sha256:abc123',
  createdAt: now,
  updatedAt: now,
};

const createInsertReturningDb = <T>(stored: T): Database =>
  ({
    insert: () => ({
      values: () => ({
        returning: async () => [stored],
      }),
    }),
  }) as unknown as Database;

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
        }),
      }),
    }),
  }) as unknown as Database;

describe('SCORM repository', () => {
  it('creates a SCORM package', async () => {
    const db = createInsertReturningDb(samplePackageRow);
    const result = await createScormPackage(db, {
      tenantId,
      courseId,
      title: 'Intro to Evidence',
      scormVersion: '1.2',
      launchUrl: 'https://cdn.example.com/scorm/index.html',
      manifest: { schemaVersion: '1.2' },
      status: 'published',
    });
    expect(result.scormVersion).toBe('1.2');
    expect(result.launchUrl.startsWith('https://')).toBe(true);
  });

  it('lists packages for a course filtered by status', async () => {
    const db = createSelectOrderByDb([samplePackageRow]);
    const result = await listScormPackagesForCourse(db, {
      tenantId,
      courseId,
      statuses: ['published'],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Intro to Evidence');
  });

  it('upserts a SCORM attempt with completion state', async () => {
    const db = createUpsertReturningDb(sampleAttemptRow);
    const result = await upsertScormAttempt(db, {
      tenantId,
      scormPackageId: packageId,
      studentId,
      completionStatus: 'incomplete',
      successStatus: 'unknown',
      scoreScaled: 0.4,
      totalTimeSeconds: 360,
      suspendData: 'state=lesson1',
      lastVisitedAt: now,
    });
    expect(result.completionStatus).toBe('incomplete');
    expect(result.scoreScaled).toBe(0.4);
  });

  it('upserts extracted SCORM content for AI indexing', async () => {
    const db = createUpsertReturningDb(sampleExtractedContentRow);
    const result = await upsertScormExtractedContent(db, {
      tenantId,
      courseId,
      scormPackageId: packageId,
      sourceKey: 'sco:introduction',
      title: 'Introduction SCO',
      body: 'Evidence must be introduced, cited, and explained.',
      language: 'en-US',
      learningObjectiveIds: [learningObjectiveId],
      sourceVersion: 'manifest-sha256:abc123',
    });

    expect(result.sourceKey).toBe('sco:introduction');
    expect(result.learningObjectiveIds).toEqual([learningObjectiveId]);
  });

  it('lists extracted SCORM content for a package', async () => {
    const db = createSelectOrderByDb([sampleExtractedContentRow]);
    const result = await listScormExtractedContentForPackage(db, {
      tenantId,
      scormPackageId: packageId,
    });

    expect(result).toEqual([sampleExtractedContentRow]);
  });

  it('rejects a non-HTTPS launch URL', async () => {
    const db = createInsertReturningDb(samplePackageRow);
    await expect(
      createScormPackage(db, {
        tenantId,
        courseId,
        title: 'Bad URL',
        scormVersion: '1.2',
        launchUrl: 'http://cdn.example.com/scorm/index.html',
        manifest: {},
        status: 'published',
      }),
    ).rejects.toThrow();
  });
});
