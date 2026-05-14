import { describe, expect, it } from 'vitest';
import {
  type RagContentSource,
  type RetrieveRelevantChunksInput,
  buildRagChunks,
  retrieveRelevantChunks,
} from '../src/rag.ts';

const sourceBase = {
  tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2T',
  courseId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
  sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2W',
  title: 'Evidence explanation',
  visibility: 'student_visible',
  sourceVersion: '3',
  learningObjectiveIds: ['objective-evidence'],
  updatedAt: new Date('2026-05-10T00:00:00.000Z'),
} satisfies Omit<RagContentSource, 'sourceType' | 'body'>;

describe('RAG indexing and retrieval', () => {
  it('indexes course pages, assignments, and rubrics with reproducible chunk metadata', () => {
    const chunks = buildRagChunks([
      {
        ...sourceBase,
        sourceType: 'course_page',
        body: 'Evidence needs explanation. A quote alone is not enough.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
        sourceType: 'assignment',
        body: 'Write an essay that explains how evidence supports the claim.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        sourceType: 'rubric',
        body: 'Developing evidence: quotes are present but relevance is unclear.',
      },
    ]);

    expect(chunks.map((chunk) => chunk.sourceType)).toEqual([
      'course_page',
      'assignment',
      'rubric',
    ]);
    expect(chunks[0]).toEqual(
      expect.objectContaining({
        tenantId: sourceBase.tenantId,
        courseId: sourceBase.courseId,
        embedding: expect.arrayContaining([expect.any(Number)]),
        sourceVersion: '3',
        embeddingModel: 'lexical-dev',
        embeddingModelVersion: '2026-05-10',
        chunkingStrategyVersion: 'paragraph-v1',
      }),
    );
    expect(chunks[0]?.embedding).toHaveLength(8);
  });

  it('indexes broader MVP course content with language and access-policy metadata', () => {
    const chunks = buildRagChunks([
      {
        ...sourceBase,
        sourceType: 'syllabus',
        moduleId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        unitId: '01J9QW7B6N5W2YH3D3A1V0KE31',
        language: 'en-US',
        accessPolicy: 'course_member',
        body: 'The syllabus explains how evidence work is assessed.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE32',
        sourceType: 'teacher_example',
        visibility: 'teacher_only',
        language: 'en-US',
        accessPolicy: 'course_staff',
        body: 'Teacher example feedback about evidence explanation.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE33',
        sourceType: 'video_transcript',
        language: 'en-US',
        accessPolicy: 'course_member',
        body: 'Transcript segment about connecting evidence to claims.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE35',
        sourceType: 'scorm_package',
        language: 'en-US',
        accessPolicy: 'course_member',
        body: 'Extracted SCORM passage about explaining evidence.',
      },
    ]);

    expect(chunks.map((chunk) => chunk.sourceType)).toEqual([
      'syllabus',
      'teacher_example',
      'video_transcript',
      'scorm_package',
    ]);
    expect(chunks[0]).toEqual(
      expect.objectContaining({
        moduleId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        unitId: '01J9QW7B6N5W2YH3D3A1V0KE31',
        language: 'en-US',
        accessPolicy: 'course_member',
      }),
    );
    expect(chunks[1]).toEqual(
      expect.objectContaining({
        visibility: 'teacher_only',
        accessPolicy: 'course_staff',
      }),
    );
  });

  it('rejects invalid RAG chunking options before indexing', () => {
    const sources: RagContentSource[] = [
      {
        ...sourceBase,
        sourceType: 'course_page',
        body: 'Evidence explanation means connecting a quote to the claim.',
      },
    ];

    expect(() => buildRagChunks(sources, { maxChunkCharacters: Number.NaN })).toThrow();
    expect(() => buildRagChunks(sources, { maxChunkCharacters: 1.5 })).toThrow();
    expect(() => buildRagChunks(sources, { embeddingModel: '' })).toThrow();
  });

  it('retrieves relevant chunks while enforcing tenant, course, and visibility filters', () => {
    const chunks = buildRagChunks([
      {
        ...sourceBase,
        sourceType: 'course_page',
        body: 'Evidence explanation means connecting a quote to the claim.',
      },
      {
        ...sourceBase,
        tenantId: '01J9QW7B6N5W2YH3D3A1V0KE30',
        sourceType: 'course_page',
        body: 'Cross-tenant evidence explanation should never appear.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE31',
        sourceType: 'course_page',
        visibility: 'teacher_only',
        accessPolicy: 'course_staff',
        body: 'Teacher-only answer key about evidence explanation.',
      },
      {
        ...sourceBase,
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE34',
        sourceType: 'teacher_example',
        visibility: 'student_visible',
        accessPolicy: 'course_staff',
        body: 'Staff-only example about evidence explanation.',
      },
    ]);

    const results = retrieveRelevantChunks({
      query: 'How do I explain evidence for my claim?',
      tenantId: sourceBase.tenantId,
      courseId: sourceBase.courseId,
      allowedVisibilities: ['student_visible'],
      allowedAccessPolicies: ['course_member'],
      chunks,
      limit: 3,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.chunk.content).toContain('connecting a quote');
    expect(results[0]?.relevanceScore).toBeGreaterThan(0);
  });

  it('rejects retrieval inputs with invalid limits or embedding dimensions', () => {
    const chunks = buildRagChunks([
      {
        ...sourceBase,
        sourceType: 'course_page',
        body: 'Evidence explanation means connecting a quote to the claim.',
      },
    ]);
    const input: RetrieveRelevantChunksInput = {
      query: 'How do I explain evidence?',
      tenantId: sourceBase.tenantId,
      courseId: sourceBase.courseId,
      allowedVisibilities: ['student_visible'],
      allowedAccessPolicies: ['course_member'],
      chunks,
      limit: 3,
    };

    expect(() =>
      retrieveRelevantChunks({
        ...input,
        queryEmbedding: [1, 0],
      }),
    ).toThrow();
    expect(() =>
      retrieveRelevantChunks({
        ...input,
        limit: -1,
      }),
    ).toThrow();
  });
});
