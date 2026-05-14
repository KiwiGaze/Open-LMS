import {
  LearningSupportConversation,
  type LearningSupportConversation as LearningSupportConversationContract,
  type LearningSupportReusableOutcome,
  type LearningSupportSourceCitation,
  LearningSupportTutorSession,
  type LearningSupportTutorSession as LearningSupportTutorSessionContract,
} from '@openlms/contracts';

export type BuildLearningSupportConversationInput = {
  tenantId: string;
  courseId: string;
  studentId: string;
  objectiveIds: string[];
  evidenceIds: string[];
  unresolvedMisconceptionIds: string[];
  citedSources: LearningSupportSourceCitation[];
  fallbackThreadId: string | null;
  resolvedOutcome: LearningSupportReusableOutcome | null;
  updatedAt: Date;
};

export type BuildLearningSupportTutorSessionInput = BuildLearningSupportConversationInput & {
  sessionId: string;
};

const hasLearningState = (input: BuildLearningSupportConversationInput): boolean =>
  input.objectiveIds.length > 0 ||
  input.evidenceIds.length > 0 ||
  input.unresolvedMisconceptionIds.length > 0 ||
  input.citedSources.length > 0 ||
  input.resolvedOutcome !== null;

const getEscalationState = (
  input: BuildLearningSupportConversationInput,
): LearningSupportConversationContract['escalationState'] => {
  if (input.resolvedOutcome !== null) return 'resolved';
  if (input.unresolvedMisconceptionIds.length > 0 && input.evidenceIds.length > 0) {
    return 'needs_instructor';
  }
  return 'none';
};

export const buildLearningSupportConversation = (
  input: BuildLearningSupportConversationInput,
): LearningSupportConversationContract => {
  const mode = hasLearningState(input) ? 'learning_support' : 'traditional_thread_fallback';
  const status = input.resolvedOutcome === null ? 'open' : 'resolved';
  const escalationState = getEscalationState(input);

  return LearningSupportConversation.parse({
    tenantId: input.tenantId,
    courseId: input.courseId,
    studentId: input.studentId,
    mode,
    status,
    escalationState,
    objectiveIds: input.objectiveIds,
    evidenceIds: input.evidenceIds,
    unresolvedMisconceptionIds: input.unresolvedMisconceptionIds,
    citedSources: input.citedSources,
    reusableOutcome: input.resolvedOutcome,
    fallbackThreadId: input.fallbackThreadId,
    updatedAt: input.updatedAt,
  });
};

const getTutorState = (
  input: BuildLearningSupportConversationInput,
): LearningSupportTutorSessionContract['tutorState'] => {
  if (input.resolvedOutcome !== null) return 'resolved';
  if (input.fallbackThreadId !== null && input.unresolvedMisconceptionIds.length > 0) {
    return 'escalated';
  }
  if (input.unresolvedMisconceptionIds.length > 0 && input.evidenceIds.length > 0) {
    return 'handoff_recommended';
  }
  return 'active';
};

export const buildLearningSupportTutorSession = (
  input: BuildLearningSupportTutorSessionInput,
): LearningSupportTutorSessionContract =>
  LearningSupportTutorSession.parse({
    sessionId: input.sessionId,
    tenantId: input.tenantId,
    courseId: input.courseId,
    studentId: input.studentId,
    objectiveIds: input.objectiveIds,
    evidenceIds: input.evidenceIds,
    unresolvedMisconceptionIds: input.unresolvedMisconceptionIds,
    citedSources: input.citedSources,
    tutorState: getTutorState(input),
    fallbackThreadId: input.fallbackThreadId,
    reusableOutcome: input.resolvedOutcome,
    updatedAt: input.updatedAt,
  });
