import {
  LearningInterventionPlan,
  type LearningInterventionPlan as LearningInterventionPlanContract,
  LearningObjectiveId,
  TeacherCopilotBrief,
  type TeacherCopilotBrief as TeacherCopilotBriefContract,
  type TeacherCopilotInsight as TeacherCopilotInsightContract,
  type TraditionalAnalyticsFallbackSummary,
  UserId,
} from '@openlms/contracts';

export type InterventionObjectiveSummary = {
  learnerId: string;
  objectiveId: string;
  evidenceCount: number;
  averageScorePercent: number | null;
  confidence: number;
  growthTrend: 'improving' | 'stable' | 'declining' | 'insufficient_evidence';
  unresolvedMisconceptionIds: string[];
  lastObservedAt: Date | null;
};

export type BuildLearningInterventionPlanInput = {
  tenantId: string;
  courseId: string;
  generatedAt: Date;
  objectiveSummaries: InterventionObjectiveSummary[];
  fallbackSummary: TraditionalAnalyticsFallbackSummary | null;
  followUpDays: number;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const hasMisconceptionNeed = (summary: InterventionObjectiveSummary): boolean =>
  summary.unresolvedMisconceptionIds.length > 0;

const hasRemediationNeed = (summary: InterventionObjectiveSummary): boolean =>
  summary.averageScorePercent !== null &&
  summary.averageScorePercent < 65 &&
  summary.growthTrend !== 'improving';

const buildReason = (summary: InterventionObjectiveSummary): string => {
  if (hasMisconceptionNeed(summary)) {
    return `Unresolved misconceptions: ${summary.unresolvedMisconceptionIds.join(', ')}.`;
  }
  return `Average score ${summary.averageScorePercent?.toFixed(1) ?? 'unknown'}% with ${summary.growthTrend} trend.`;
};

const buildRecommendedAction = (summary: InterventionObjectiveSummary): string => {
  if (hasMisconceptionNeed(summary)) {
    return 'Assign targeted support and ask the learner to revise their explanation for this objective.';
  }
  return 'Schedule a short check-in and assign prerequisite practice for this objective.';
};

export const buildLearningInterventionPlan = (
  input: BuildLearningInterventionPlanInput,
): LearningInterventionPlanContract => {
  if (input.objectiveSummaries.length === 0) {
    return LearningInterventionPlan.parse({
      tenantId: input.tenantId,
      courseId: input.courseId,
      generatedAt: input.generatedAt,
      sourceMode: 'traditional_analytics_fallback',
      interventions: [],
      fallbackSummary: input.fallbackSummary,
    });
  }

  const interventions = input.objectiveSummaries
    .filter((summary) => hasMisconceptionNeed(summary) || hasRemediationNeed(summary))
    .map((summary) => ({
      tenantId: input.tenantId,
      courseId: input.courseId,
      subjectType: 'learner',
      learnerId: summary.learnerId,
      objectiveId: summary.objectiveId,
      needType: hasMisconceptionNeed(summary) ? 'misconception' : 'remediation',
      reason: buildReason(summary),
      confidence: summary.confidence,
      evidenceCount: summary.evidenceCount,
      recommendedAction: buildRecommendedAction(summary),
      followUpDueAt: addDays(input.generatedAt, input.followUpDays),
      status: 'open',
      outcome: null,
    }));

  return LearningInterventionPlan.parse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    generatedAt: input.generatedAt,
    sourceMode: 'evidence',
    interventions,
    fallbackSummary: null,
  });
};

type MisconceptionCluster = {
  misconceptionId: string;
  summaries: InterventionObjectiveSummary[];
};

const averageConfidence = (summaries: InterventionObjectiveSummary[]): number =>
  summaries.reduce((total, summary) => total + summary.confidence, 0) / summaries.length;

const totalEvidenceCount = (summaries: InterventionObjectiveSummary[]): number =>
  summaries.reduce((total, summary) => total + summary.evidenceCount, 0);

const buildMisconceptionClusters = (
  summaries: InterventionObjectiveSummary[],
): MisconceptionCluster[] => {
  const byMisconceptionId = new Map<string, InterventionObjectiveSummary[]>();

  for (const summary of summaries) {
    for (const misconceptionId of summary.unresolvedMisconceptionIds) {
      const existing = byMisconceptionId.get(misconceptionId) ?? [];
      byMisconceptionId.set(misconceptionId, [...existing, summary]);
    }
  }

  return Array.from(byMisconceptionId.entries())
    .map(([misconceptionId, entries]) => ({ misconceptionId, summaries: entries }))
    .filter((cluster) => cluster.summaries.length >= 2)
    .sort((left, right) => {
      const evidenceDelta =
        totalEvidenceCount(right.summaries) - totalEvidenceCount(left.summaries);
      if (evidenceDelta !== 0) return evidenceDelta;
      return left.misconceptionId.localeCompare(right.misconceptionId);
    });
};

const buildMisconceptionClusterInsight = (
  cluster: MisconceptionCluster,
): TeacherCopilotInsightContract => {
  const firstSummary = cluster.summaries[0];
  return {
    insightType: 'misconception_cluster',
    subject: `${cluster.summaries.length} learners share misconception ${cluster.misconceptionId}.`,
    summary: `Multiple learners show ${cluster.misconceptionId}; treat it as a cohort-level misconception before assigning more independent work.`,
    confidence: averageConfidence(cluster.summaries),
    evidenceCount: totalEvidenceCount(cluster.summaries),
    learnerIds: cluster.summaries.map((summary) => UserId.parse(summary.learnerId)),
    relatedObjectiveId:
      firstSummary === undefined ? null : LearningObjectiveId.parse(firstSummary.objectiveId),
    recommendedAction:
      'Open a short reteach with contrast examples, then assign a revised explanation.',
  };
};

const buildCohortDriftInsight = (
  summaries: InterventionObjectiveSummary[],
): TeacherCopilotInsightContract | null => {
  const declining = summaries.filter((summary) => summary.growthTrend === 'declining');
  if (declining.length < 2) return null;

  const firstSummary = declining[0];
  return {
    insightType: 'cohort_drift',
    subject: `${declining.length} learners are trending down on the same objective.`,
    summary:
      'Recent evidence is declining for several learners, so the next class move should check understanding before new content.',
    confidence: averageConfidence(declining),
    evidenceCount: totalEvidenceCount(declining),
    learnerIds: declining.map((summary) => UserId.parse(summary.learnerId)),
    relatedObjectiveId:
      firstSummary === undefined ? null : LearningObjectiveId.parse(firstSummary.objectiveId),
    recommendedAction:
      'Run a quick diagnostic probe and group follow-up practice by response pattern.',
  };
};

const buildTraditionalSummaryInsight = (
  fallbackSummary: TraditionalAnalyticsFallbackSummary,
): TeacherCopilotInsightContract => ({
  insightType: 'traditional_summary',
  subject: 'Traditional activity summary only.',
  summary:
    'No learning evidence summaries are available yet, so the copilot can only report activity volume.',
  confidence: 0,
  evidenceCount: 0,
  learnerIds: [],
  relatedObjectiveId: null,
  recommendedAction: `Review recent submissions manually: ${fallbackSummary.totalSubmissions} submissions across ${fallbackSummary.publishedAssignments} assignments and ${fallbackSummary.publishedQuizzes} quizzes.`,
});

export const buildTeacherCopilotBrief = (
  input: BuildLearningInterventionPlanInput,
): TeacherCopilotBriefContract => {
  const interventionPlan = buildLearningInterventionPlan(input);
  const insights =
    input.objectiveSummaries.length === 0 && input.fallbackSummary !== null
      ? [buildTraditionalSummaryInsight(input.fallbackSummary)]
      : [
          ...buildMisconceptionClusters(input.objectiveSummaries).map(
            buildMisconceptionClusterInsight,
          ),
          buildCohortDriftInsight(input.objectiveSummaries),
        ].filter((insight): insight is TeacherCopilotInsightContract => insight !== null);

  return TeacherCopilotBrief.parse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    generatedAt: input.generatedAt,
    sourceMode: interventionPlan.sourceMode,
    insights,
    interventionPlan,
    fallbackSummary: interventionPlan.fallbackSummary,
  });
};
