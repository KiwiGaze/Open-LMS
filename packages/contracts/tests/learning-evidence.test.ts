import { describe, expect, it } from 'vitest';
import {
  LearningEvidence,
  LearningEvidenceProjection,
  ObjectiveEvidenceSummary,
} from '../src/learning-evidence.ts';

const now = new Date('2026-05-13T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE2Y';
const evidenceId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';

describe('learning evidence contracts', () => {
  it('captures learning signals beyond artifact scores', () => {
    expect(
      LearningEvidence.parse({
        id: evidenceId,
        tenantId,
        courseId,
        studentId,
        objectiveId,
        source: {
          sourceType: 'assignment_submission',
          sourceId: assignmentId,
          attempt: 2,
          observedAt: now,
        },
        signal: 'revision',
        score: 7,
        maxScore: 10,
        confidence: 0.72,
        misconceptionIds: ['confuses-correlation-causation'],
        evidenceText: 'The revision fixed the definition but repeated the causal claim.',
        provenance: {
          observedByUserId: null,
          extractionModel: 'gpt-5.2',
          extractionPromptIdentifier: 'learning_evidence.extract.v1',
        },
        context: {
          citedResourceIds: ['page-1'],
          supportThreadId: null,
          modelReadableSummary:
            'Student revised the definition but still treats correlation as causation.',
        },
        createdAt: now,
      }),
    ).toMatchObject({
      signal: 'revision',
      confidence: 0.72,
      misconceptionIds: ['confuses-correlation-causation'],
      provenance: {
        extractionModel: 'gpt-5.2',
        extractionPromptIdentifier: 'learning_evidence.extract.v1',
      },
      context: {
        citedResourceIds: ['page-1'],
      },
    });
  });

  it('summarizes objective growth with unresolved misconceptions', () => {
    expect(
      ObjectiveEvidenceSummary.parse({
        objectiveId,
        evidenceCount: 3,
        averageScorePercent: 76.7,
        confidence: 0.64,
        growthTrend: 'improving',
        unresolvedMisconceptionIds: ['confuses-correlation-causation'],
        lastObservedAt: now,
      }),
    ).toMatchObject({
      averageScorePercent: 76.7,
      growthTrend: 'improving',
    });
  });

  it('keeps conventional grades as a projection, not the evidence model', () => {
    expect(
      LearningEvidenceProjection.parse({
        tenantId,
        courseId,
        studentId,
        generatedAt: now,
        sourceMode: 'traditional_grade_fallback',
        objectiveSummaries: [],
        projectedGrade: {
          score: 82,
          maxScore: 100,
          source: 'traditional_gradebook',
        },
      }),
    ).toMatchObject({
      sourceMode: 'traditional_grade_fallback',
      projectedGrade: { score: 82, maxScore: 100 },
    });
  });
});
