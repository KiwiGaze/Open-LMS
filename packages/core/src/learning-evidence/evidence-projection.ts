import {
  type LearningEvidence,
  LearningEvidenceProjection,
  type LearningEvidenceProjection as LearningEvidenceProjectionContract,
  type LearningEvidenceSignal,
  LearningObjectiveId,
  type ObjectiveEvidenceSummary,
} from '@openlms/contracts';

export type EvidenceProjectionInputEvidence = {
  objectiveId: string;
  signal: LearningEvidenceSignal;
  score: number | null;
  maxScore: number | null;
  confidence: number;
  misconceptionIds: string[];
  observedAt: Date;
};

export type TraditionalGradeProjectionInput = {
  score: number;
  maxScore: number;
};

export type ProjectLearningEvidenceInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
  evidence: EvidenceProjectionInputEvidence[];
  traditionalGrade: TraditionalGradeProjectionInput | null;
  generatedAt: Date;
};

type EvidenceBucket = {
  objectiveId: string;
  evidence: EvidenceProjectionInputEvidence[];
};

const roundToSingleDecimal = (value: number): number => Math.round(value * 10) / 10;

const getScorePercent = (evidence: EvidenceProjectionInputEvidence): number | null => {
  if (evidence.score === null || evidence.maxScore === null || evidence.maxScore <= 0) return null;
  return (evidence.score / evidence.maxScore) * 100;
};

const summarizeGrowthTrend = (
  evidence: EvidenceProjectionInputEvidence[],
): ObjectiveEvidenceSummary['growthTrend'] => {
  const scoredEvidence = evidence
    .map((entry) => ({ entry, percent: getScorePercent(entry) }))
    .filter(
      (entry): entry is { entry: EvidenceProjectionInputEvidence; percent: number } =>
        entry.percent !== null,
    )
    .sort((left, right) => left.entry.observedAt.getTime() - right.entry.observedAt.getTime());

  if (scoredEvidence.length < 2) return 'insufficient_evidence';
  const first = scoredEvidence[0]?.percent ?? 0;
  const last = scoredEvidence[scoredEvidence.length - 1]?.percent ?? 0;
  if (last > first) return 'improving';
  if (last < first) return 'declining';
  return 'stable';
};

const summarizeBucket = (bucket: EvidenceBucket): ObjectiveEvidenceSummary => {
  const scorePercents = bucket.evidence
    .map((entry) => getScorePercent(entry))
    .filter((percent): percent is number => percent !== null);
  const averageScorePercent =
    scorePercents.length === 0
      ? null
      : roundToSingleDecimal(
          scorePercents.reduce((total, percent) => total + percent, 0) / scorePercents.length,
        );
  const confidence =
    bucket.evidence.reduce((total, entry) => total + entry.confidence, 0) / bucket.evidence.length;
  const misconceptionIds = Array.from(
    new Set(bucket.evidence.flatMap((entry) => entry.misconceptionIds)),
  ).sort();
  const lastObservedAt =
    bucket.evidence
      .map((entry) => entry.observedAt)
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

  return {
    objectiveId: LearningObjectiveId.parse(bucket.objectiveId),
    evidenceCount: bucket.evidence.length,
    averageScorePercent,
    confidence,
    growthTrend: summarizeGrowthTrend(bucket.evidence),
    unresolvedMisconceptionIds: misconceptionIds,
    lastObservedAt,
  };
};

const groupEvidenceByObjective = (
  evidence: EvidenceProjectionInputEvidence[],
): EvidenceBucket[] => {
  const bucketsByObjectiveId = new Map<string, EvidenceProjectionInputEvidence[]>();
  for (const entry of evidence) {
    const existing = bucketsByObjectiveId.get(entry.objectiveId) ?? [];
    bucketsByObjectiveId.set(entry.objectiveId, [...existing, entry]);
  }
  return Array.from(bucketsByObjectiveId.entries())
    .map(([objectiveId, entries]) => ({ objectiveId, evidence: entries }))
    .sort((left, right) => left.objectiveId.localeCompare(right.objectiveId));
};

const projectGradeFromEvidence = (
  evidence: EvidenceProjectionInputEvidence[],
  traditionalGrade: TraditionalGradeProjectionInput | null,
): LearningEvidenceProjectionContract['projectedGrade'] => {
  if (evidence.length === 0) {
    return traditionalGrade === null
      ? null
      : {
          score: traditionalGrade.score,
          maxScore: traditionalGrade.maxScore,
          source: 'traditional_gradebook',
        };
  }

  const scoredEvidence = evidence.filter(
    (entry): entry is EvidenceProjectionInputEvidence & { score: number; maxScore: number } =>
      entry.score !== null && entry.maxScore !== null,
  );
  if (scoredEvidence.length === 0) return null;

  return {
    score: scoredEvidence.reduce((total, entry) => total + entry.score, 0),
    maxScore: scoredEvidence.reduce((total, entry) => total + entry.maxScore, 0),
    source: 'learning_evidence',
  };
};

export const projectLearningEvidence = (
  input: ProjectLearningEvidenceInput,
): LearningEvidenceProjectionContract => {
  const objectiveSummaries = groupEvidenceByObjective(input.evidence).map(summarizeBucket);
  return LearningEvidenceProjection.parse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    studentId: input.studentId,
    generatedAt: input.generatedAt,
    sourceMode: input.evidence.length === 0 ? 'traditional_grade_fallback' : 'evidence',
    objectiveSummaries,
    projectedGrade: projectGradeFromEvidence(input.evidence, input.traditionalGrade),
  });
};

export type ProjectLearningEvidenceFromLedgerInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
  evidence: LearningEvidence[];
  traditionalGrade: TraditionalGradeProjectionInput | null;
  generatedAt: Date;
};

export const projectLearningEvidenceFromLedger = (
  input: ProjectLearningEvidenceFromLedgerInput,
): LearningEvidenceProjectionContract =>
  projectLearningEvidence({
    tenantId: input.tenantId,
    courseId: input.courseId,
    studentId: input.studentId,
    evidence: input.evidence.map((entry) => ({
      objectiveId: entry.objectiveId,
      signal: entry.signal,
      score: entry.score,
      maxScore: entry.maxScore,
      confidence: entry.confidence,
      misconceptionIds: entry.misconceptionIds,
      observedAt: entry.source.observedAt,
    })),
    traditionalGrade: input.traditionalGrade,
    generatedAt: input.generatedAt,
  });
