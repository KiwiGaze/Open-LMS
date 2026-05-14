import { ContextPackage } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import { adaptContextPackage } from '../src/context-adapter.ts';
import { buildRagChunks } from '../src/rag.ts';

describe('context adapter', () => {
  it('turns Core context packages into model-ready messages', () => {
    const contextPackage = ContextPackage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      actionIdentifier: 'feedback_draft',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      resources: [
        {
          resourceType: 'rubric',
          resourceId: 'rubric-1',
          title: 'Evidence criterion',
          body: 'Explain how evidence supports the claim.',
          metadata: {},
        },
      ],
      policyStamp: {
        allowed: true,
        requiresHumanReview: true,
        reason: 'AI action allowed by policy.',
        policyVersion: 2,
        signalQualityClass: null,
      },
      createdAt: new Date(),
    });

    const adapted = adaptContextPackage(contextPackage);

    expect(adapted.promptIdentifier).toBe('feedback_draft.default');
    expect(adapted.promptVersion).toBe('2026-05-10.1');
    expect(adapted.requiresHumanReview).toBe(true);
    expect(adapted.messages[0]?.content).toContain('criterion-level');
    expect(adapted.messages[1]?.content).toContain('Evidence criterion');
    expect(adapted.messages[1]?.content).toContain('Policy version: 2');
    expect(adapted.messages[1]?.content).toContain('Signal quality: none');
  });

  it('adds retrieved context as traceable model input when provided', () => {
    const contextPackage = ContextPackage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      actionIdentifier: 'page_explanation',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      resources: [
        {
          resourceType: 'course_page',
          resourceId: 'page-1',
          title: 'Evidence overview',
          body: 'Evidence should be explained.',
          metadata: {},
        },
      ],
      policyStamp: {
        allowed: true,
        requiresHumanReview: false,
        reason: 'AI action allowed by policy.',
        policyVersion: 2,
        signalQualityClass: 'partial',
      },
      createdAt: new Date(),
    });
    const [chunk] = buildRagChunks([
      {
        tenantId: contextPackage.tenantId,
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        sourceType: 'course_page',
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
        title: 'Worked example',
        body: 'A strong paragraph explains why the selected quote proves the claim.',
        visibility: 'student_visible',
        sourceVersion: '1',
        learningObjectiveIds: ['objective-evidence'],
        updatedAt: new Date(),
      },
    ]);

    const adapted = adaptContextPackage(contextPackage, {
      retrievedChunks: chunk ? [{ chunk, relevanceScore: 0.82 }] : [],
      retrievalPolicy: {
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        allowedVisibilities: ['student_visible'],
        allowedAccessPolicies: ['course_member'],
      },
    });

    expect(adapted.messages[1]?.content).toContain('Retrieved context');
    expect(adapted.messages[1]?.content).toContain('Worked example');
    expect(adapted.messages[1]?.content).toContain('Signal quality: partial');
    expect(adapted.retrievalTrace).toEqual([
      {
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
        sourceTitle: 'Worked example',
        sourceType: 'course_page',
        sourceVersion: '1',
        relevanceScore: 0.82,
        visibility: 'student_visible',
        accessPolicy: 'course_member',
        learningObjectiveIds: ['objective-evidence'],
      },
    ]);
  });

  it('rejects retrieved context that is not authorized for the adapter policy', () => {
    const contextPackage = ContextPackage.parse({
      id: '01J9QW7B6N5W2YH3D3A1V0KE2T',
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE2V',
      actionIdentifier: 'page_explanation',
      actorId: '01J9QW7B6N5W2YH3D3A1V0KE2X',
      resources: [
        {
          resourceType: 'course_page',
          resourceId: 'page-1',
          title: 'Evidence overview',
          body: 'Evidence should be explained.',
          metadata: {},
        },
      ],
      policyStamp: {
        allowed: true,
        requiresHumanReview: false,
        reason: 'AI action allowed by policy.',
        policyVersion: 2,
        signalQualityClass: 'partial',
      },
      createdAt: new Date(),
    });
    const [chunk] = buildRagChunks([
      {
        tenantId: contextPackage.tenantId,
        courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
        sourceType: 'course_page',
        sourceId: '01J9QW7B6N5W2YH3D3A1V0KE2Z',
        title: 'Teacher note',
        body: 'This teacher-only note should not enter a student explanation prompt.',
        visibility: 'teacher_only',
        accessPolicy: 'course_staff',
        sourceVersion: '1',
        learningObjectiveIds: ['objective-evidence'],
        updatedAt: new Date(),
      },
    ]);

    expect(() =>
      adaptContextPackage(contextPackage, {
        retrievedChunks: chunk ? [{ chunk, relevanceScore: 0.82 }] : [],
        retrievalPolicy: {
          courseId: '01J9QW7B6N5W2YH3D3A1V0KE2Y',
          allowedVisibilities: ['student_visible'],
          allowedAccessPolicies: ['course_member'],
        },
      }),
    ).toThrow(/retrieved context includes/i);
  });
});
