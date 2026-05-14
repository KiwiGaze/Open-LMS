import type {
  CourseId,
  LearningEvidenceId,
  LearningObjectiveId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  projectLearningEvidence,
  projectLearningEvidenceFromLedger,
} from '../src/learning-evidence/evidence-projection.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as UserId;
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as LearningObjectiveId;
const now = new Date('2026-05-13T00:00:00.000Z');

describe('projectLearningEvidence', () => {
  it('projects conventional grades when no objective evidence exists', () => {
    const projection = projectLearningEvidence({
      tenantId,
      courseId,
      studentId,
      evidence: [],
      traditionalGrade: {
        score: 41,
        maxScore: 50,
      },
      generatedAt: now,
    });

    expect(projection.sourceMode).toBe('traditional_grade_fallback');
    expect(projection.objectiveSummaries).toEqual([]);
    expect(projection.projectedGrade).toEqual({
      score: 41,
      maxScore: 50,
      source: 'traditional_gradebook',
    });
  });

  it('summarizes confidence, revision trend, and unresolved misconceptions by objective', () => {
    const projection = projectLearningEvidence({
      tenantId,
      courseId,
      studentId,
      evidence: [
        {
          objectiveId,
          signal: 'attempt',
          score: 4,
          maxScore: 10,
          confidence: 0.4,
          misconceptionIds: ['uses-addition-for-ratio'],
          observedAt: new Date('2026-05-10T00:00:00.000Z'),
        },
        {
          objectiveId,
          signal: 'revision',
          score: 8,
          maxScore: 10,
          confidence: 0.7,
          misconceptionIds: [],
          observedAt: now,
        },
      ],
      traditionalGrade: {
        score: 12,
        maxScore: 20,
      },
      generatedAt: now,
    });

    expect(projection.sourceMode).toBe('evidence');
    expect(projection.projectedGrade).toEqual({
      score: 12,
      maxScore: 20,
      source: 'learning_evidence',
    });
    expect(projection.objectiveSummaries).toEqual([
      {
        objectiveId,
        evidenceCount: 2,
        averageScorePercent: 60,
        confidence: 0.55,
        growthTrend: 'improving',
        unresolvedMisconceptionIds: ['uses-addition-for-ratio'],
        lastObservedAt: now,
      },
    ]);
  });

  it('projects persisted evidence ledger records without depending on gradebook rows', () => {
    const projection = projectLearningEvidenceFromLedger({
      tenantId,
      courseId,
      studentId,
      evidence: [
        {
          id: '01J9QW7B6N5W2YH3D3A1V0KE2Y' as LearningEvidenceId,
          tenantId,
          courseId,
          studentId,
          objectiveId,
          source: {
            sourceType: 'support_conversation',
            sourceId: 'support-session-1',
            attempt: null,
            observedAt: new Date('2026-05-11T00:00:00.000Z'),
          },
          signal: 'misconception',
          score: null,
          maxScore: null,
          confidence: 0.8,
          misconceptionIds: ['ratio-as-subtraction'],
          evidenceText: 'Student explained a ratio by subtracting the two quantities.',
          provenance: {
            observedByUserId: null,
            extractionModel: 'gpt-5.2',
            extractionPromptIdentifier: 'learning_evidence.extract.v1',
          },
          context: {
            citedResourceIds: ['page-1'],
            supportThreadId: 'support-session-1',
            modelReadableSummary:
              'The learner is using subtraction to compare multiplicative quantities.',
          },
          createdAt: now,
        },
      ],
      traditionalGrade: null,
      generatedAt: now,
    });

    expect(projection.sourceMode).toBe('evidence');
    expect(projection.projectedGrade).toBeNull();
    expect(projection.objectiveSummaries).toEqual([
      {
        objectiveId,
        evidenceCount: 1,
        averageScorePercent: null,
        confidence: 0.8,
        growthTrend: 'insufficient_evidence',
        unresolvedMisconceptionIds: ['ratio-as-subtraction'],
        lastObservedAt: new Date('2026-05-11T00:00:00.000Z'),
      },
    ]);
  });
});
