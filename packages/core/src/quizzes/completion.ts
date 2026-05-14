import type { CompletionProgress, CompletionRequirement } from '@openlms/contracts';
import {
  completeCompletionProgress,
  listActivePassQuizCompletionRequirements,
} from '../completion/repository.ts';
import type { DatabaseExecutor } from '../db/client.ts';

export type CompletePassQuizRequirementsForAttemptInput = {
  tenantId: string;
  courseId: string;
  quizId: string;
  studentId: string;
  score: number;
  maxScore: number;
  completedAt: Date;
};

const scoreMeetsCompletionThreshold = (
  requirement: CompletionRequirement,
  score: number,
  maxScore: number,
): boolean => {
  if (requirement.minScorePercent === null) {
    return true;
  }

  if (maxScore <= 0) {
    return requirement.minScorePercent <= 0;
  }

  return (score / maxScore) * 100 >= requirement.minScorePercent;
};

export const completePassQuizRequirementsForAttempt = async (
  db: DatabaseExecutor,
  input: CompletePassQuizRequirementsForAttemptInput,
  now = new Date(),
): Promise<CompletionProgress[]> => {
  const requirements = await listActivePassQuizCompletionRequirements(db, {
    tenantId: input.tenantId,
    courseId: input.courseId,
    quizId: input.quizId,
  });
  const completed: CompletionProgress[] = [];

  for (const requirement of requirements) {
    if (!scoreMeetsCompletionThreshold(requirement, input.score, input.maxScore)) {
      continue;
    }

    completed.push(
      await completeCompletionProgress(
        db,
        {
          tenantId: input.tenantId,
          requirementId: requirement.id,
          studentId: input.studentId,
          completedAt: input.completedAt,
        },
        now,
      ),
    );
  }

  return completed;
};
