import {
  type LearningObjective,
  LearningObjectiveMastery,
  type LearningObjectiveMastery as LearningObjectiveMasteryContract,
  LearningObjectiveMasteryId,
  type LearningObjectiveMasteryStatus,
  type PublishedFeedback,
  type Rubric,
} from '@openlms/contracts';
import { ulid } from 'ulid';

// Maps a student's score percentage on a learning objective to a coarse
// mastery status. The threshold is the percentage at-or-above which the
// student is considered to have mastered the objective. When no threshold is
// configured we fall back to the conventional 80%; when no score is known we
// return 'not_assessed'.
export const computeLearningObjectiveMasteryStatus = (
  scorePercent: number | null,
  masteryThresholdPercent: number | null,
): LearningObjectiveMasteryStatus => {
  if (scorePercent === null) {
    return 'not_assessed';
  }

  const threshold = masteryThresholdPercent ?? 80;

  if (scorePercent >= threshold) {
    return 'mastered';
  }

  // Anything within 15 percentage points of the threshold counts as proficient.
  if (scorePercent >= Math.max(threshold - 15, 0)) {
    return 'proficient';
  }

  return 'developing';
};

export type ProjectPublishedFeedbackToLearningObjectiveMasteryInput = {
  publishedFeedback: PublishedFeedback;
  rubric: Rubric;
  learningObjectives: LearningObjective[];
  courseId: string;
  studentId: string;
};

type ObjectiveScore = {
  learningObjective: LearningObjective;
  score: number;
  maxScore: number;
  evidenceCount: number;
};

export const projectPublishedFeedbackToLearningObjectiveMastery = (
  input: ProjectPublishedFeedbackToLearningObjectiveMasteryInput,
): LearningObjectiveMasteryContract[] => {
  const objectivesById = new Map<string, LearningObjective>(
    input.learningObjectives.map((objective) => [objective.id, objective]),
  );
  const criteriaById = new Map(input.rubric.criteria.map((criterion) => [criterion.id, criterion]));
  const scoresByObjectiveId = new Map<string, ObjectiveScore>();

  for (const criterionFeedback of input.publishedFeedback.criterionFeedback) {
    if (criterionFeedback.suggestedScore === null) {
      continue;
    }

    const criterion = criteriaById.get(criterionFeedback.criterionId);
    if (!criterion || criterion.learningObjectiveIds.length === 0) {
      continue;
    }

    const maxScore = Math.max(...criterion.levels.map((level) => level.points));
    if (maxScore <= 0) {
      continue;
    }

    for (const learningObjectiveId of criterion.learningObjectiveIds) {
      const learningObjective = objectivesById.get(learningObjectiveId);
      if (!learningObjective) {
        continue;
      }

      const existing = scoresByObjectiveId.get(learningObjectiveId) ?? {
        learningObjective,
        score: 0,
        maxScore: 0,
        evidenceCount: 0,
      };

      scoresByObjectiveId.set(learningObjectiveId, {
        learningObjective,
        score: existing.score + criterionFeedback.suggestedScore,
        maxScore: existing.maxScore + maxScore,
        evidenceCount: existing.evidenceCount + 1,
      });
    }
  }

  return Array.from(scoresByObjectiveId.entries()).map(([learningObjectiveId, objectiveScore]) => {
    const scorePercent = (objectiveScore.score / objectiveScore.maxScore) * 100;

    return LearningObjectiveMastery.parse({
      id: LearningObjectiveMasteryId.parse(ulid()),
      tenantId: input.publishedFeedback.tenantId,
      courseId: input.courseId,
      learningObjectiveId,
      studentId: input.studentId,
      status: computeLearningObjectiveMasteryStatus(
        scorePercent,
        objectiveScore.learningObjective.masteryThresholdPercent,
      ),
      score: objectiveScore.score,
      maxScore: objectiveScore.maxScore,
      lastAssessedAt: input.publishedFeedback.publishedAt,
      evidenceCount: objectiveScore.evidenceCount,
      createdAt: input.publishedFeedback.publishedAt,
      updatedAt: input.publishedFeedback.publishedAt,
    });
  });
};
