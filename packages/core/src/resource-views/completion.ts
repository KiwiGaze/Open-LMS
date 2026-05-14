import type { CourseResourceViewEvent } from '@openlms/contracts';
import type { Database } from '../db/client.ts';
import {
  completeCompletionProgress,
  listActiveViewResourceCompletionRequirements,
} from '../completion/repository.ts';
import { getCourseResourceForCourse } from '../courses/repository.ts';
import { recordResourceView, type RecordResourceViewInput } from './repository.ts';

export type RecordResourceViewWithCompletionInput = RecordResourceViewInput & {
  completeRequirements?: boolean;
};

export class CourseResourceViewTargetNotFoundError extends Error {
  constructor() {
    super('Course resource was not found in this course.');
  }
}

export const recordResourceViewWithCompletion = async (
  db: Database,
  input: RecordResourceViewWithCompletionInput,
  now = new Date(),
): Promise<CourseResourceViewEvent> => {
  return db.transaction(async (tx) => {
    const resource = await getCourseResourceForCourse(tx, {
      tenantId: input.tenantId,
      courseId: input.courseId,
      courseResourceId: input.resourceId,
    });

    if (!resource) {
      throw new CourseResourceViewTargetNotFoundError();
    }

    const event = await recordResourceView(tx, input, now);
    if (input.completeRequirements === false) {
      return event;
    }

    const requirements = await listActiveViewResourceCompletionRequirements(tx, {
      tenantId: input.tenantId,
      courseId: input.courseId,
      resourceId: input.resourceId,
    });

    for (const requirement of requirements) {
      await completeCompletionProgress(
        tx,
        {
          tenantId: input.tenantId,
          requirementId: requirement.id,
          studentId: input.viewerId,
          completedAt: input.viewedAt,
        },
        now,
      );
    }

    return event;
  });
};
