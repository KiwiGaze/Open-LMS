import { describe, expect, it } from 'vitest';
import {
  assignmentStatusTransitions,
  isValidAssignmentStatusTransition,
} from '../src/assignments/status-transitions.ts';

describe('assignmentStatusTransitions', () => {
  it('publishes a draft assignment', () => {
    expect(isValidAssignmentStatusTransition('draft', 'published')).toBe(true);
  });

  it('archives a draft assignment', () => {
    expect(isValidAssignmentStatusTransition('draft', 'archived')).toBe(true);
  });

  it('returns a published assignment to draft', () => {
    expect(isValidAssignmentStatusTransition('published', 'draft')).toBe(true);
  });

  it('archives a published assignment', () => {
    expect(isValidAssignmentStatusTransition('published', 'archived')).toBe(true);
  });

  it('re-drafts an archived assignment', () => {
    expect(isValidAssignmentStatusTransition('archived', 'draft')).toBe(true);
  });

  it('does not republish directly from archived', () => {
    expect(isValidAssignmentStatusTransition('archived', 'published')).toBe(false);
  });

  it('treats same-state transitions as valid no-ops', () => {
    expect(isValidAssignmentStatusTransition('draft', 'draft')).toBe(true);
    expect(isValidAssignmentStatusTransition('published', 'published')).toBe(true);
    expect(isValidAssignmentStatusTransition('archived', 'archived')).toBe(true);
  });

  it('exposes the full transition map for inspection', () => {
    expect(assignmentStatusTransitions.draft).toEqual(['published', 'archived']);
    expect(assignmentStatusTransitions.published).toEqual(['draft', 'archived']);
    expect(assignmentStatusTransitions.archived).toEqual(['draft']);
  });
});
