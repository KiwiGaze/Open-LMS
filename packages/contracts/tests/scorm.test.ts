import { describe, expect, it } from 'vitest';
import {
  RagChunkRecord,
  ScormExtractedContent,
  ScormPackage,
  ScormRuntimeCommit,
  ScormRuntimeState,
} from '../src/index.ts';

const now = new Date('2026-05-12T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const scormPackageId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const extractedContentId = '01J9QW7B6N5W2YH3D3A1V0KE75';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE76';

describe('SCORM contracts', () => {
  it('models SCORM packages as launchable legacy content', () => {
    const scormPackage = ScormPackage.parse({
      id: scormPackageId,
      tenantId,
      courseId,
      title: 'Intro to Evidence',
      scormVersion: '1.2',
      launchUrl: 'https://cdn.example.com/scorm/index.html',
      manifest: { schemaVersion: '1.2' },
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });

    expect(scormPackage.launchUrl).toContain('https://');
  });

  it('models extracted SCORM content as an AI-indexable source', () => {
    const extracted = ScormExtractedContent.parse({
      id: extractedContentId,
      tenantId,
      courseId,
      scormPackageId,
      sourceKey: 'sco:introduction',
      title: 'Introduction SCO',
      body: 'Evidence must be introduced, cited, and explained.',
      language: 'en-US',
      learningObjectiveIds: [learningObjectiveId],
      sourceVersion: 'manifest-sha256:abc123',
      createdAt: now,
      updatedAt: now,
    });

    expect(extracted.learningObjectiveIds).toEqual([learningObjectiveId]);
  });

  it('allows SCORM extracted content to be stored as RAG chunks', () => {
    const chunk = RagChunkRecord.parse({
      id: `${extractedContentId}:manifest-sha256:abc123:0`,
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      sourceType: 'scorm_package',
      sourceId: extractedContentId,
      sourceTitle: 'Introduction SCO',
      chunkIndex: 0,
      content: 'Evidence must be introduced, cited, and explained.',
      visibility: 'student_visible',
      sourceVersion: 'manifest-sha256:abc123',
      language: 'en-US',
      accessPolicy: 'course_member',
      learningObjectiveIds: [learningObjectiveId],
      embedding: [1, 0, 0, 0, 0, 0, 0, 0],
      embeddingModel: 'lexical-dev',
      embeddingModelVersion: '2026-05-10',
      chunkingStrategyVersion: 'paragraph-v1',
      sourceUpdatedAt: now,
      indexedAt: now,
    });

    expect(chunk.sourceType).toBe('scorm_package');
  });

  it('models SCORM runtime bridge commits and returned state', () => {
    const commit = ScormRuntimeCommit.parse({
      values: {
        'cmi.core.lesson_status': 'passed',
        'cmi.core.score.raw': '87',
        'cmi.core.session_time': '0000:12:30.00',
        'cmi.completion_status': 'completed',
        'cmi.success_status': 'passed',
        'cmi.score.scaled': '0.87',
        'cmi.session_time': 'PT12M30S',
        'cmi.suspend_data': 'bookmark=section-2',
      },
    });
    const state = ScormRuntimeState.parse({
      attempt: {
        id: '01J9QW7B6N5W2YH3D3A1V0KE77',
        tenantId,
        scormPackageId,
        studentId: '01J9QW7B6N5W2YH3D3A1V0KE78',
        completionStatus: 'completed',
        successStatus: 'passed',
        scoreScaled: 0.87,
        totalTimeSeconds: 750,
        suspendData: 'bookmark=section-2',
        lastVisitedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      values: {
        'cmi.core.lesson_status': 'passed',
        'cmi.core.score.raw': '87',
        'cmi.core.total_time': '0000:12:30.00',
        'cmi.suspend_data': 'bookmark=section-2',
        'cmi.core.entry': 'resume',
        'cmi.completion_status': 'completed',
        'cmi.success_status': 'passed',
        'cmi.score.scaled': '0.87',
        'cmi.total_time': 'PT12M30S',
        'cmi.entry': 'resume',
      },
    });

    expect(commit.values['cmi.core.lesson_status']).toBe('passed');
    expect(commit.values['cmi.completion_status']).toBe('completed');
    expect(state.values['cmi.core.total_time']).toBe('0000:12:30.00');
    expect(state.values['cmi.total_time']).toBe('PT12M30S');
  });
});
