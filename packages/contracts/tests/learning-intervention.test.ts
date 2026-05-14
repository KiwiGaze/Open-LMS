import { describe, expect, it } from 'vitest';
import {
  LearningIntervention,
  LearningInterventionPlan,
  TeacherCopilotBrief,
} from '../src/learning-intervention.ts';

const now = new Date('2026-05-13T00:00:00.000Z');
const followUpDueAt = new Date('2026-05-20T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const objectiveId = '01J9QW7B6N5W2YH3D3A1V0KE2X';

describe('learning intervention contracts', () => {
  it('models actionable learner intervention state with evidence and follow-up', () => {
    expect(
      LearningIntervention.parse({
        tenantId,
        courseId,
        subjectType: 'learner',
        learnerId: studentId,
        objectiveId,
        needType: 'misconception',
        reason: 'Learner repeatedly treats correlation as causation.',
        confidence: 0.82,
        evidenceCount: 4,
        recommendedAction: 'Assign targeted examples and ask for a revised explanation.',
        followUpDueAt,
        status: 'open',
        outcome: null,
      }),
    ).toMatchObject({
      subjectType: 'learner',
      needType: 'misconception',
      confidence: 0.82,
      status: 'open',
    });
  });

  it('keeps count-only analytics as an explicit fallback plan', () => {
    expect(
      LearningInterventionPlan.parse({
        tenantId,
        courseId,
        generatedAt: now,
        sourceMode: 'traditional_analytics_fallback',
        interventions: [],
        fallbackSummary: {
          enrolledStudents: 22,
          totalSubmissions: 49,
          publishedAssignments: 3,
          publishedQuizzes: 1,
        },
      }),
    ).toMatchObject({
      sourceMode: 'traditional_analytics_fallback',
      fallbackSummary: {
        enrolledStudents: 22,
        totalSubmissions: 49,
      },
    });
  });

  it('models teacher copilot insights separately from raw activity counts', () => {
    expect(
      TeacherCopilotBrief.parse({
        tenantId,
        courseId,
        generatedAt: now,
        sourceMode: 'evidence',
        insights: [
          {
            insightType: 'misconception_cluster',
            subject: '2 learners share misconception confuses-correlation-causation.',
            summary:
              'Several learners are using correlation claims as causal proof on the evidence objective.',
            confidence: 0.79,
            evidenceCount: 7,
            learnerIds: [studentId],
            relatedObjectiveId: objectiveId,
            recommendedAction:
              'Open a short reteach with contrast examples, then assign a revised explanation.',
          },
        ],
        interventionPlan: {
          tenantId,
          courseId,
          generatedAt: now,
          sourceMode: 'evidence',
          interventions: [],
          fallbackSummary: null,
        },
        fallbackSummary: null,
      }),
    ).toMatchObject({
      sourceMode: 'evidence',
      insights: [
        {
          insightType: 'misconception_cluster',
          relatedObjectiveId: objectiveId,
        },
      ],
    });
  });
});
