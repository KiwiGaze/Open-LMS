import type { CourseId, LearningObjectiveId, TenantId, UserId } from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildLearningInterventionPlan,
  buildTeacherCopilotBrief,
} from '../src/interventions/engine.ts';

const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T' as TenantId;
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V' as CourseId;
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W' as UserId;
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X' as LearningObjectiveId;
const now = new Date('2026-05-13T00:00:00.000Z');

describe('buildLearningInterventionPlan', () => {
  it('falls back to traditional count analytics when no evidence summaries exist', () => {
    const plan = buildLearningInterventionPlan({
      tenantId,
      courseId,
      generatedAt: now,
      objectiveSummaries: [],
      fallbackSummary: {
        enrolledStudents: 12,
        totalSubmissions: 20,
        publishedAssignments: 2,
        publishedQuizzes: 1,
      },
      followUpDays: 5,
    });

    expect(plan.sourceMode).toBe('traditional_analytics_fallback');
    expect(plan.interventions).toEqual([]);
    expect(plan.fallbackSummary).toMatchObject({ enrolledStudents: 12, totalSubmissions: 20 });
  });

  it('creates evidence-backed learner interventions with follow-up deadlines', () => {
    const plan = buildLearningInterventionPlan({
      tenantId,
      courseId,
      generatedAt: now,
      objectiveSummaries: [
        {
          learnerId: studentId,
          objectiveId,
          evidenceCount: 3,
          averageScorePercent: 54,
          confidence: 0.78,
          growthTrend: 'declining',
          unresolvedMisconceptionIds: ['ratio-as-subtraction'],
          lastObservedAt: now,
        },
      ],
      fallbackSummary: null,
      followUpDays: 5,
    });

    expect(plan.sourceMode).toBe('evidence');
    expect(plan.fallbackSummary).toBeNull();
    expect(plan.interventions).toEqual([
      {
        tenantId,
        courseId,
        subjectType: 'learner',
        learnerId: studentId,
        objectiveId,
        needType: 'misconception',
        reason: 'Unresolved misconceptions: ratio-as-subtraction.',
        confidence: 0.78,
        evidenceCount: 3,
        recommendedAction:
          'Assign targeted support and ask the learner to revise their explanation for this objective.',
        followUpDueAt: new Date('2026-05-18T00:00:00.000Z'),
        status: 'open',
        outcome: null,
      },
    ]);
  });

  it('keeps evidence mode when evidence exists but no intervention threshold is crossed', () => {
    const plan = buildLearningInterventionPlan({
      tenantId,
      courseId,
      generatedAt: now,
      objectiveSummaries: [
        {
          learnerId: studentId,
          objectiveId,
          evidenceCount: 3,
          averageScorePercent: 74,
          confidence: 0.7,
          growthTrend: 'improving',
          unresolvedMisconceptionIds: [],
          lastObservedAt: now,
        },
      ],
      fallbackSummary: null,
      followUpDays: 5,
    });

    expect(plan.sourceMode).toBe('evidence');
    expect(plan.interventions).toEqual([]);
    expect(plan.fallbackSummary).toBeNull();
  });

  it('builds teacher copilot misconception clusters and cohort drift insights', () => {
    const brief = buildTeacherCopilotBrief({
      tenantId,
      courseId,
      generatedAt: now,
      objectiveSummaries: [
        {
          learnerId: studentId,
          objectiveId,
          evidenceCount: 3,
          averageScorePercent: 54,
          confidence: 0.78,
          growthTrend: 'declining',
          unresolvedMisconceptionIds: ['ratio-as-subtraction'],
          lastObservedAt: now,
        },
        {
          learnerId: '01J9QW7B6N5W2YH3D3A1V0KE31' as UserId,
          objectiveId,
          evidenceCount: 4,
          averageScorePercent: 58,
          confidence: 0.74,
          growthTrend: 'declining',
          unresolvedMisconceptionIds: ['ratio-as-subtraction'],
          lastObservedAt: now,
        },
      ],
      fallbackSummary: null,
      followUpDays: 5,
    });

    expect(brief.sourceMode).toBe('evidence');
    expect(brief.insights.map((insight) => insight.insightType)).toEqual([
      'misconception_cluster',
      'cohort_drift',
    ]);
    expect(brief.insights[0]).toMatchObject({
      subject: '2 learners share misconception ratio-as-subtraction.',
      evidenceCount: 7,
      relatedObjectiveId: objectiveId,
    });
  });
});
