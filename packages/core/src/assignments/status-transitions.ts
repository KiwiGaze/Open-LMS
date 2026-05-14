import type { AssignmentStatus } from '@openlms/contracts';

// Static map of permitted assignment lifecycle transitions. Aligns with the
// instructor workflow: drafts can be published or archived; published work
// can be archived or returned to draft; archived assignments can only be
// re-drafted (avoid surprising learners with a sudden re-publish).
export const assignmentStatusTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
  draft: ['published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

export const isValidAssignmentStatusTransition = (
  current: AssignmentStatus,
  next: AssignmentStatus,
): boolean => {
  if (current === next) {
    return true;
  }
  return assignmentStatusTransitions[current].includes(next);
};
