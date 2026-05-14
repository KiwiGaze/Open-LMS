import type { CompletionProgress } from '@openlms/contracts';
import {
  completeCompletionProgress,
  listActiveSubmitAssignmentCompletionRequirements,
} from '../completion/repository.ts';
import type { DatabaseExecutor } from '../db/client.ts';

export type CompleteSubmitAssignmentRequirementsForSubmissionInput = {
  tenantId: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  completedAt: Date;
};

export const completeSubmitAssignmentRequirementsForSubmission = async (
  db: DatabaseExecutor,
  input: CompleteSubmitAssignmentRequirementsForSubmissionInput,
  now = new Date(),
): Promise<CompletionProgress[]> => {
  const requirements = await listActiveSubmitAssignmentCompletionRequirements(db, {
    tenantId: input.tenantId,
    courseId: input.courseId,
    assignmentId: input.assignmentId,
  });
  const completed: CompletionProgress[] = [];

  for (const requirement of requirements) {
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
