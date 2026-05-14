import {
  Assignment,
  AssignmentOverride,
  AssignmentPeerReview,
  AttendanceRecord,
  AttendanceSession,
  CompletionProgress,
  CompletionRequirement,
  ConversationMessage,
  ConversationThread,
  Course,
  CourseAnnouncement,
  CourseCredential,
  CourseGroup,
  CourseGroupMember,
  CourseGroupSet,
  type CoursePage,
  CourseSection,
  CredentialAward,
  DiscussionPost,
  DiscussionTopic,
  Draft,
  QuestionBank,
  QuestionBankQuestion,
  Quiz,
  QuizAttempt,
  QuizAttemptProbe,
  QuizAttemptProbeResponse,
  QuizAttemptResponse,
  QuizQuestion,
  Rubric,
  Submission,
  SubmissionAttachment,
  SubmissionComment,
  UserId,
} from '@openlms/contracts';
import { describe, expect, it } from 'vitest';
import {
  createCourseAnnouncement,
  listCourseAnnouncementsForCourse,
} from '../src/announcements/repository.ts';
import {
  getAssignmentById,
  listAssignmentOverridesForAssignment,
  listAssignmentsForCourse,
  saveAssignment,
} from '../src/assignments/repository.ts';
import {
  AttendanceSessionUnavailableError,
  AttendanceStudentUnavailableError,
  createAttendanceSession,
  listAttendanceRecordsForSession,
  listAttendanceSessionsForCourse,
  recordAttendanceRecord,
} from '../src/attendance/repository.ts';
import {
  listCompletionProgressForRequirement,
  listCompletionRequirementsForCourse,
} from '../src/completion/repository.ts';
import {
  createCourse,
  createCoursePage,
  createCourseSection,
  getCourseById,
  getCourseEnrollmentInfo,
  listCourseSectionsForCourse,
  saveCourse,
} from '../src/courses/repository.ts';
import {
  listCredentialAwardsForCredential,
  listCredentialsForCourse,
} from '../src/credentials/repository.ts';
import type { Database } from '../src/db/client.ts';
import {
  createDiscussionPost,
  createDiscussionTopic,
  listDiscussionPostsForTopic,
  listDiscussionTopicsForCourse,
  updateDiscussionPost,
} from '../src/discussions/repository.ts';
import {
  getCourseGroupForCourse,
  listCourseGroupMembers,
  listCourseGroupSetsForCourse,
  listCourseGroupsForCourse,
} from '../src/groups/repository.ts';
import {
  listConversationMessagesForThread,
  listConversationThreadsForCourse,
} from '../src/messaging/repository.ts';
import {
  createQuiz,
  getQuizAccessControlsForCourse,
  listQuestionBankQuestionsForBank,
  listQuestionBanksForCourse,
  listQuizAttemptProbesForAttempt,
  listQuizAttemptResponsesForAttempt,
  listQuizAttemptsForQuiz,
  listQuizQuestionsForQuiz,
  listQuizzesForCourse,
  recordQuizAttempt,
  recordQuizAttemptProbe,
  recordQuizAttemptProbeResponse,
  recordQuizAttemptResponse,
  saveQuizAttempt,
  saveQuizAttemptProbe,
  saveQuizAttemptProbeResponse,
  saveQuizAttemptResponse,
  submitQuizAttempt,
} from '../src/quizzes/repository.ts';
import { getRubricById, saveRubric } from '../src/rubrics/repository.ts';
import {
  createSubmissionAttachment,
  createSubmissionComment,
  getSubmissionById,
  listAssignmentPeerReviewsForAssignment,
  listSubmissionAttachmentsForSubmission,
  listSubmissionCommentsForSubmission,
  listSubmissionsForAssignment,
  listSubmissionsForStudentAssignment,
  saveDraft,
  saveStudentDraft,
  saveSubmission,
} from '../src/submissions/repository.ts';

const now = new Date('2026-05-10T00:00:00.000Z');
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE2T';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE2V';
const rubricId = '01J9QW7B6N5W2YH3D3A1V0KE2W';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE2X';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE31';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE32';
const assignmentOverrideId = '01J9QW7B6N5W2YH3D3A1V0KE7G';
const assignmentPeerReviewId = '01J9QW7B6N5W2YH3D3A1V0KE7Q';
const studentId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE2Y');
const draftId = '01J9QW7B6N5W2YH3D3A1V0KE2Z';
const discussionTopicId = '01J9QW7B6N5W2YH3D3A1V0KE36';
const discussionPostId = '01J9QW7B6N5W2YH3D3A1V0KE37';
const courseSectionId = '01J9QW7B6N5W2YH3D3A1V0KE3E';
const announcementId = '01J9QW7B6N5W2YH3D3A1V0KE5J';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE43';
const quizQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE44';
const quizAttemptId = '01J9QW7B6N5W2YH3D3A1V0KE5E';
const quizAttemptResponseId = '01J9QW7B6N5W2YH3D3A1V0KE5F';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE77';
const questionBankQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE78';
const attendanceSessionId = '01J9QW7B6N5W2YH3D3A1V0KE4C';
const attendanceRecordId = '01J9QW7B6N5W2YH3D3A1V0KE4D';
const completionRequirementId = '01J9QW7B6N5W2YH3D3A1V0KE4J';
const completionProgressId = '01J9QW7B6N5W2YH3D3A1V0KE4K';
const coursePageId = '01J9QW7B6N5W2YH3D3A1V0KE4L';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE4M';
const credentialId = '01J9QW7B6N5W2YH3D3A1V0KE4R';
const credentialAwardId = '01J9QW7B6N5W2YH3D3A1V0KE4S';
const conversationThreadId = '01J9QW7B6N5W2YH3D3A1V0KE4Y';
const conversationMessageId = '01J9QW7B6N5W2YH3D3A1V0KE50';
const courseGroupSetId = '01J9QW7B6N5W2YH3D3A1V0KE55';
const courseGroupId = '01J9QW7B6N5W2YH3D3A1V0KE56';
const courseGroupMemberId = '01J9QW7B6N5W2YH3D3A1V0KE57';
const submissionAttachmentId = '01J9QW7B6N5W2YH3D3A1V0KE5P';
const submissionAttachmentFileId = '01J9QW7B6N5W2YH3D3A1V0KE5Q';
const submissionCommentId = '01J9QW7B6N5W2YH3D3A1V0KE5Y';
const peerReviewerId = UserId.parse('01J9QW7B6N5W2YH3D3A1V0KE7R');
const otherSubmissionId = '01J9QW7B6N5W2YH3D3A1V0KE83';

const course = Course.parse({
  id: courseId,
  tenantId,
  code: 'ENG-101',
  title: 'Evidence Writing',
  status: 'active',
  startsAt: now,
  endsAt: null,
  createdAt: now,
  updatedAt: now,
});

const rubric = Rubric.parse({
  id: rubricId,
  tenantId,
  title: 'Evidence rubric',
  version: 1,
  sourceTemplateId: null,
  criteria: [
    {
      id: 'evidence',
      label: 'Evidence',
      description: 'Uses evidence and explains why it matters.',
      evidenceRequired: true,
      levels: [
        {
          id: 'developing',
          label: 'Developing',
          description: 'Evidence is present but weakly explained.',
          points: 2,
        },
      ],
    },
  ],
  createdAt: now,
  updatedAt: now,
});

const assignment = Assignment.parse({
  id: assignmentId,
  tenantId,
  courseId,
  title: 'Evidence essay',
  instructions: 'Explain how a quote supports your claim.',
  status: 'published',
  dueAt: null,
  allowResubmission: true,
  activeRubricId: rubric.id,
  aiSettings: {
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
  },
  createdAt: now,
  updatedAt: now,
});

const assignmentOverride = AssignmentOverride.parse({
  id: assignmentOverrideId,
  tenantId,
  assignmentId,
  targetType: 'user',
  targetId: studentId,
  opensAt: now,
  dueAt: new Date('2026-05-12T00:00:00.000Z'),
  closesAt: null,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const courseAnnouncement = CourseAnnouncement.parse({
  id: announcementId,
  tenantId,
  courseId,
  authorId: studentId,
  title: 'Bring annotated drafts',
  body: 'Please bring annotated drafts to the next seminar.',
  status: 'published',
  pinned: true,
  postedAt: now,
  createdAt: now,
  updatedAt: now,
});

const draft = Draft.parse({
  id: draftId,
  tenantId,
  assignmentId,
  studentId,
  blocks: [{ blockId: 'intro', text: 'The quote supports the claim.' }],
  createdAt: now,
  updatedAt: now,
});

const submission = Submission.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE30',
  tenantId,
  assignmentId,
  studentId,
  sourceDraftId: draft.id,
  version: 1,
  status: 'submitted',
  contentSnapshot: draft.blocks,
  submittedAt: now,
  createdAt: now,
});

const submissionAttachment = SubmissionAttachment.parse({
  id: submissionAttachmentId,
  tenantId,
  submissionId: submission.id,
  fileResourceId: submissionAttachmentFileId,
  displayName: 'evidence-appendix.pdf',
  position: 0,
  createdAt: now,
});

const submissionComment = SubmissionComment.parse({
  id: submissionCommentId,
  tenantId,
  submissionId: submission.id,
  authorId: studentId,
  body: 'Please expand the evidence explanation.',
  visibility: 'student_visible',
  createdAt: now,
  updatedAt: now,
});

const assignmentPeerReview = AssignmentPeerReview.parse({
  id: assignmentPeerReviewId,
  tenantId,
  assignmentId,
  submissionId: submission.id,
  reviewerId: peerReviewerId,
  status: 'assigned',
  dueAt: new Date('2026-05-12T00:00:00.000Z'),
  submittedAt: null,
  createdAt: now,
  updatedAt: now,
});

const discussionTopic = DiscussionTopic.parse({
  id: discussionTopicId,
  tenantId,
  courseId,
  title: 'Essay workshop',
  prompt: 'Share one paragraph and ask for one specific kind of feedback.',
  visibility: 'published',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const discussionPost = DiscussionPost.parse({
  id: discussionPostId,
  tenantId,
  topicId: discussionTopicId,
  authorId: studentId,
  parentPostId: null,
  body: 'I am unsure whether my evidence connects clearly enough.',
  status: 'published',
  createdAt: now,
  updatedAt: now,
});

const courseSection = CourseSection.parse({
  id: courseSectionId,
  tenantId,
  courseId,
  name: 'Section A',
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const quiz = Quiz.parse({
  id: quizId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Evidence check',
  description: 'Check whether evidence is connected to the claim.',
  status: 'published',
  opensAt: now,
  closesAt: null,
  timeLimitMinutes: 30,
  shuffleQuestions: false,
  maxAttempts: 2,
  createdAt: now,
  updatedAt: now,
});

const quizQuestion = QuizQuestion.parse({
  id: quizQuestionId,
  tenantId,
  quizId,
  position: 0,
  questionType: 'multiple_choice',
  prompt: 'Which sentence best connects the evidence to the claim?',
  points: 2,
  choices: [
    { id: 'a', text: 'It repeats the quote.' },
    { id: 'b', text: 'It explains why the quote matters.' },
  ],
  createdAt: now,
  updatedAt: now,
});

const quizAttempt = QuizAttempt.parse({
  id: quizAttemptId,
  tenantId,
  quizId,
  studentId,
  attemptNumber: 1,
  status: 'submitted',
  startedAt: now,
  submittedAt: new Date('2026-05-10T00:30:00.000Z'),
  score: 8,
  createdAt: now,
  updatedAt: now,
});

const quizAttemptResponse = QuizAttemptResponse.parse({
  id: quizAttemptResponseId,
  tenantId,
  quizId,
  attemptId: quizAttemptId,
  questionId: quizQuestionId,
  answer: {
    kind: 'choice',
    selectedChoiceIds: ['b'],
  },
  createdAt: now,
  updatedAt: now,
});

const quizAttemptProbe = QuizAttemptProbe.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE60',
  tenantId,
  quizId,
  attemptId: quizAttemptId,
  learningObjectiveId,
  sourceQuestionBankQuestionId: null,
  position: 0,
  difficultyTarget: 0.65,
  prompt: 'Explain how the evidence supports the claim.',
  renderModel: { format: 'free_response' },
  points: 4,
  answerKey: {
    kind: 'text',
    acceptedAnswers: ['Evidence supports the claim when the explanation connects them.'],
    caseSensitive: false,
  },
  aiGenerationLogId: null,
  createdAt: now,
});

const quizAttemptProbeResponse = QuizAttemptProbeResponse.parse({
  id: '01J9QW7B6N5W2YH3D3A1V0KE61',
  tenantId,
  quizId,
  attemptId: quizAttemptId,
  probeId: quizAttemptProbe.id,
  answer: {
    kind: 'text',
    text: 'The evidence supports the claim because it explains the reason.',
  },
  createdAt: now,
  updatedAt: now,
});

const questionBank = QuestionBank.parse({
  id: questionBankId,
  tenantId,
  courseId,
  title: 'Evidence reasoning bank',
  description: 'Reusable evidence and explanation prompts.',
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const questionBankQuestion = QuestionBankQuestion.parse({
  id: questionBankQuestionId,
  tenantId,
  questionBankId,
  position: 0,
  questionType: 'multiple_choice',
  prompt: 'Which sentence best connects the evidence to the claim?',
  points: 2,
  choices: [
    { id: 'a', text: 'It repeats the quote.' },
    { id: 'b', text: 'It explains why the quote matters.' },
  ],
  createdAt: now,
  updatedAt: now,
});

const attendanceSession = AttendanceSession.parse({
  id: attendanceSessionId,
  tenantId,
  courseId,
  title: 'Week 1 seminar',
  startsAt: now,
  endsAt: new Date('2026-05-10T01:00:00.000Z'),
  status: 'scheduled',
  createdAt: now,
  updatedAt: now,
});

const attendanceRecord = AttendanceRecord.parse({
  id: attendanceRecordId,
  tenantId,
  sessionId: attendanceSessionId,
  studentId,
  status: 'present',
  note: null,
  recordedAt: now,
  createdAt: now,
  updatedAt: now,
});

const completionRequirement = CompletionRequirement.parse({
  id: completionRequirementId,
  tenantId,
  courseId,
  moduleId: null,
  title: 'Submit the evidence essay',
  description: 'Students must submit the main writing assignment.',
  requirementType: 'submit_assignment',
  targetType: 'assignment',
  targetId: assignmentId,
  minScorePercent: null,
  status: 'active',
  required: true,
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const completionProgress = CompletionProgress.parse({
  id: completionProgressId,
  tenantId,
  requirementId: completionRequirementId,
  studentId,
  status: 'completed',
  completedAt: now,
  createdAt: now,
  updatedAt: now,
});

const courseCredential = CourseCredential.parse({
  id: credentialId,
  tenantId,
  courseId,
  credentialType: 'certificate',
  title: 'Evidence writing certificate',
  description: 'Issued when a student completes the evidence writing course.',
  criteriaSummary: 'Complete all required activities.',
  status: 'published',
  imageUrl: null,
  createdAt: now,
  updatedAt: now,
});

const credentialAward = CredentialAward.parse({
  id: credentialAwardId,
  tenantId,
  credentialId,
  studentId,
  status: 'issued',
  issuedAt: now,
  revokedAt: null,
  expiresAt: null,
  createdAt: now,
  updatedAt: now,
});

const conversationThread = ConversationThread.parse({
  id: conversationThreadId,
  tenantId,
  courseId,
  subject: 'Essay feedback question',
  status: 'open',
  participantIds: [studentId, '01J9QW7B6N5W2YH3D3A1V0KE4Z'],
  lastMessageAt: now,
  createdAt: now,
  updatedAt: now,
});

const conversationMessage = ConversationMessage.parse({
  id: conversationMessageId,
  tenantId,
  threadId: conversationThreadId,
  senderId: studentId,
  body: 'Can you clarify the evidence note?',
  sentAt: now,
  createdAt: now,
});

const courseGroupSet = CourseGroupSet.parse({
  id: courseGroupSetId,
  tenantId,
  courseId,
  name: 'Project teams',
  selfSignupEnabled: false,
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const courseGroup = CourseGroup.parse({
  id: courseGroupId,
  tenantId,
  courseId,
  groupSetId: courseGroupSetId,
  name: 'Team Alpha',
  description: 'Collaborative evidence project group.',
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const courseGroupMember = CourseGroupMember.parse({
  id: courseGroupMemberId,
  tenantId,
  groupId: courseGroupId,
  userId: studentId,
  role: 'member',
  createdAt: now,
  updatedAt: now,
});

const createInsertOnlyDb = <T>(rows: T[]): Database =>
  ({
    insert: () => ({
      values: (value: T) => ({
        onConflictDoUpdate: () => ({
          returning: async () => {
            rows.push(value);
            return [value];
          },
        }),
        returning: async () => {
          rows.push(value);
          return [value];
        },
      }),
    }),
  }) as unknown as Database;

const createDraftConflictCaptureDb = (capture: { options: unknown }): Database =>
  ({
    insert: () => ({
      values: (value: Draft) => ({
        onConflictDoUpdate: (options: unknown) => {
          capture.options = options;
          return {
            returning: async () => [value],
          };
        },
      }),
    }),
  }) as unknown as Database;

const createQuizAttemptResponseConflictCaptureDb = (capture: { options: unknown }): Database =>
  ({
    insert: () => ({
      values: (value: QuizAttemptResponse) => ({
        onConflictDoUpdate: (options: unknown) => {
          capture.options = options;
          return {
            returning: async () => [value],
          };
        },
      }),
    }),
  }) as unknown as Database;

const createQuizAttemptSubmitDb = (row: QuizAttempt): Database =>
  ({
    update: () => ({
      set: (patch: Partial<QuizAttempt>) => ({
        where: () => ({
          returning: async () => [{ ...row, ...patch }],
        }),
      }),
    }),
  }) as unknown as Database;

const createSelectOnlyDb = <T>(rows: T[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as Database;

const createAssignmentListDb = (rows: Assignment[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'published')
              .filter((row) => {
                const values = collectSqlChunkParamValues(condition);
                const moduleFilter = values.includes(moduleId) ? moduleId : null;
                const unitFilter = values.includes(unitId) ? unitId : null;
                const placedRow = row as Assignment & {
                  moduleId: string | null;
                  unitId: string | null;
                };

                return (
                  (!moduleFilter || placedRow.moduleId === moduleFilter) &&
                  (!unitFilter || placedRow.unitId === unitFilter)
                );
              })
              .sort((left, right) => {
                const values = collectSqlChunkParamValues(condition);
                const hasPlacementFilter = values.includes(moduleId) || values.includes(unitId);
                const leftPlaced = left as Assignment & { position: number | null };
                const rightPlaced = right as Assignment & { position: number | null };

                if (hasPlacementFilter) {
                  return (
                    (leftPlaced.position ?? Number.MAX_SAFE_INTEGER) -
                      (rightPlaced.position ?? Number.MAX_SAFE_INTEGER) ||
                    left.title.localeCompare(right.title)
                  );
                }

                const leftDueAt = left.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const rightDueAt = right.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

                return leftDueAt - rightDueAt || left.title.localeCompare(right.title);
              }),
        }),
      }),
    }),
  }) as unknown as Database;

const createAssignmentOverrideListDb = (
  rows: AssignmentOverride[],
  statuses: AssignmentOverride['status'][] = ['active'],
): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.assignmentId === assignmentId)
              .filter((row) => statuses.includes(row.status))
              .sort(
                (left, right) =>
                  left.targetType.localeCompare(right.targetType) ||
                  left.targetId.localeCompare(right.targetId),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createSubmissionListDb = (rows: Submission[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () =>
          Object.assign(
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.assignmentId === assignmentId),
            {
              orderBy: async () =>
                rows
                  .filter((row) => row.tenantId === tenantId)
                  .filter((row) => row.assignmentId === assignmentId)
                  .sort((left, right) => left.submittedAt.getTime() - right.submittedAt.getTime()),
            },
          ),
      }),
    }),
  }) as unknown as Database;

const createStudentSubmissionListDb = (rows: Submission[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () =>
          Object.assign(
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.assignmentId === assignmentId)
              .filter((row) => row.studentId === studentId),
            {
              orderBy: async () =>
                rows
                  .filter((row) => row.tenantId === tenantId)
                  .filter((row) => row.assignmentId === assignmentId)
                  .filter((row) => row.studentId === studentId)
                  .sort((left, right) => left.submittedAt.getTime() - right.submittedAt.getTime()),
            },
          ),
      }),
    }),
  }) as unknown as Database;

const createSubmissionAttachmentListDb = (rows: SubmissionAttachment[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.submissionId === submission.id)
              .sort(
                (left, right) =>
                  left.position - right.position ||
                  left.displayName.localeCompare(right.displayName),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createSubmissionCommentListDb = (rows: SubmissionComment[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.submissionId === submission.id)
              .filter((row) => row.visibility === 'student_visible')
              .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()),
        }),
      }),
    }),
  }) as unknown as Database;

const createAssignmentPeerReviewListDb = (rows: AssignmentPeerReview[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async () => {
            const values = collectSqlChunkParamValues(condition);
            const reviewerFilter = values.includes(peerReviewerId) ? peerReviewerId : null;
            const submissionFilter = values.includes(submission.id) ? submission.id : null;

            return rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.assignmentId === assignmentId)
              .filter((row) => (reviewerFilter ? row.reviewerId === reviewerFilter : true))
              .filter((row) => (submissionFilter ? row.submissionId === submissionFilter : true))
              .sort(
                (left, right) =>
                  (left.dueAt?.getTime() ?? Number.POSITIVE_INFINITY) -
                    (right.dueAt?.getTime() ?? Number.POSITIVE_INFINITY) ||
                  left.createdAt.getTime() - right.createdAt.getTime() ||
                  left.id.localeCompare(right.id),
              );
          },
        }),
      }),
    }),
  }) as unknown as Database;

const createDiscussionTopicListDb = (rows: DiscussionTopic[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => {
                const values = collectSqlChunkParamValues(condition);
                const moduleFilter = values.includes(moduleId) ? moduleId : null;
                const unitFilter = values.includes(unitId) ? unitId : null;
                const placedRow = row as DiscussionTopic & {
                  moduleId: string | null;
                  unitId: string | null;
                };

                return (
                  (!moduleFilter || placedRow.moduleId === moduleFilter) &&
                  (!unitFilter || placedRow.unitId === unitFilter)
                );
              })
              .sort((left, right) => {
                const leftPlaced = left as DiscussionTopic & { position: number | null };
                const rightPlaced = right as DiscussionTopic & { position: number | null };

                return (
                  (leftPlaced.position ?? Number.MAX_SAFE_INTEGER) -
                    (rightPlaced.position ?? Number.MAX_SAFE_INTEGER) ||
                  left.title.localeCompare(right.title)
                );
              }),
        }),
      }),
    }),
  }) as unknown as Database;

const createDiscussionPostListDb = (rows: DiscussionPost[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.topicId === discussionTopicId)
              .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()),
        }),
      }),
    }),
  }) as unknown as Database;

const createDiscussionPostUpdateDb = (rows: DiscussionPost[]): Database =>
  ({
    update: () => ({
      set: (values: Partial<DiscussionPost>) => ({
        where: () => ({
          returning: async () => {
            const row = rows[0];
            if (!row) {
              return [];
            }
            const updated = DiscussionPost.parse({ ...row, ...values });
            rows[0] = updated;
            return [updated];
          },
        }),
        returning: async () => {
          const row = rows[0];
          if (!row) {
            return [];
          }
          const updated = DiscussionPost.parse({ ...row, ...values });
          rows[0] = updated;
          return [updated];
        },
      }),
    }),
  }) as unknown as Database;

const createCourseSectionListDb = (rows: CourseSection[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'active')
              .sort(
                (left, right) =>
                  left.position - right.position || left.name.localeCompare(right.name),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseAnnouncementListDb = (rows: CourseAnnouncement[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'published')
              .sort((left, right) => {
                const pinnedOrder = Number(right.pinned) - Number(left.pinned);
                const leftPostedAt = left.postedAt?.getTime() ?? left.createdAt.getTime();
                const rightPostedAt = right.postedAt?.getTime() ?? right.createdAt.getTime();

                return (
                  pinnedOrder ||
                  rightPostedAt - leftPostedAt ||
                  left.title.localeCompare(right.title)
                );
              }),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuizListDb = (rows: Quiz[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'published')
              .filter((row) => {
                const values = collectSqlChunkParamValues(condition);
                const moduleFilter = values.includes(moduleId) ? moduleId : null;
                const unitFilter = values.includes(unitId) ? unitId : null;
                const placedRow = row as Quiz & {
                  moduleId: string | null;
                  unitId: string | null;
                };

                return (
                  (!moduleFilter || placedRow.moduleId === moduleFilter) &&
                  (!unitFilter || placedRow.unitId === unitFilter)
                );
              })
              .sort((left, right) => {
                const values = collectSqlChunkParamValues(condition);
                const hasPlacementFilter = values.includes(moduleId) || values.includes(unitId);
                const leftPlaced = left as Quiz & { position: number | null };
                const rightPlaced = right as Quiz & { position: number | null };

                if (hasPlacementFilter) {
                  return (
                    (leftPlaced.position ?? Number.MAX_SAFE_INTEGER) -
                      (rightPlaced.position ?? Number.MAX_SAFE_INTEGER) ||
                    left.title.localeCompare(right.title)
                  );
                }

                const leftOpenAt = left.opensAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const rightOpenAt = right.opensAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

                return leftOpenAt - rightOpenAt || left.title.localeCompare(right.title);
              }),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuizAccessControlsDb = (
  rows: Array<Quiz & { accessPasswordHash: string | null; allowedIpRanges: string[] }>,
): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.id === quizId)
              .map((row) => ({
                accessPasswordHash: row.accessPasswordHash,
                allowedIpRanges: row.allowedIpRanges,
              })),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuizQuestionListDb = (rows: QuizQuestion[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.quizId === quizId)
              .sort((left, right) => left.position - right.position),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuizAttemptListDb = (rows: QuizAttempt[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.quizId === quizId)
              .filter((row) => row.studentId === studentId)
              .sort((left, right) => left.attemptNumber - right.attemptNumber),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuizAttemptProbeListDb = (rows: QuizAttemptProbe[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.attemptId === quizAttemptId)
              .sort(
                (left, right) => left.position - right.position || left.id.localeCompare(right.id),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuizAttemptResponseListDb = (
  rows: QuizAttemptResponse[],
  questions: QuizQuestion[],
): Database =>
  ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: async () =>
              rows
                .filter((row) => row.tenantId === tenantId)
                .filter((row) => row.attemptId === quizAttemptId)
                .map((row) => ({
                  response: row,
                  question: questions.find((question) => question.id === row.questionId),
                }))
                .filter((row): row is { response: QuizAttemptResponse; question: QuizQuestion } =>
                  Boolean(row.question),
                )
                .sort(
                  (left, right) =>
                    left.question.position - right.question.position ||
                    left.response.id.localeCompare(right.response.id),
                )
                .map((row) => ({ response: row.response })),
          }),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuestionBankListDb = (rows: QuestionBank[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'active' || row.status === 'archived')
              .sort((left, right) => left.title.localeCompare(right.title)),
        }),
      }),
    }),
  }) as unknown as Database;

const createQuestionBankQuestionListDb = (rows: QuestionBankQuestion[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.questionBankId === questionBankId)
              .sort((left, right) => left.position - right.position),
        }),
      }),
    }),
  }) as unknown as Database;

const createAttendanceSessionListDb = (rows: AttendanceSession[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'scheduled')
              .sort(
                (left, right) =>
                  left.startsAt.getTime() - right.startsAt.getTime() ||
                  left.title.localeCompare(right.title),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createAttendanceRecordListDb = (rows: AttendanceRecord[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.sessionId === attendanceSessionId)
              .filter((row) => row.studentId === studentId)
              .sort((left, right) => left.studentId.localeCompare(right.studentId)),
        }),
      }),
    }),
  }) as unknown as Database;

const createAttendanceRecordUpsertDb = (
  rows: AttendanceRecord[],
  capture: { executionSql: string[]; options: unknown },
  queryResult: { sessionStatus?: string | null; hasStudent?: boolean } = {},
): Database =>
  ({
    transaction: async (callback: (tx: Database) => Promise<AttendanceRecord>) => {
      let executionIndex = 0;
      const tx = {
        execute: async (query: unknown) => {
          executionIndex += 1;
          capture.executionSql.push(extractDrizzleStringValues(query).join(' '));

          if (executionIndex === 1) {
            return queryResult.sessionStatus === null
              ? []
              : [{ status: queryResult.sessionStatus ?? 'scheduled' }];
          }

          return queryResult.hasStudent === false ? [] : [{ id: 'course-membership' }];
        },
        insert: () => ({
          values: (value: AttendanceRecord) => ({
            onConflictDoUpdate: (options: unknown) => {
              capture.options = options;
              return {
                returning: async () => {
                  const existingIndex = rows.findIndex(
                    (row) =>
                      row.tenantId === value.tenantId &&
                      row.sessionId === value.sessionId &&
                      row.studentId === value.studentId,
                  );

                  if (existingIndex === -1) {
                    rows.push(value);
                    return [value];
                  }

                  const updated = AttendanceRecord.parse({
                    ...rows[existingIndex],
                    ...(options as { set: Partial<AttendanceRecord> }).set,
                  });
                  rows[existingIndex] = updated;
                  return [updated];
                },
              };
            },
          }),
        }),
      } as unknown as Database;

      return callback(tx);
    },
  }) as unknown as Database;

const createCompletionRequirementListDb = (rows: CompletionRequirement[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.moduleId === null || row.moduleId === moduleId)
              .filter((row) => row.status === 'active')
              .sort(
                (left, right) =>
                  left.position - right.position || left.title.localeCompare(right.title),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createCompletionProgressListDb = (rows: CompletionProgress[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.requirementId === completionRequirementId)
              .filter((row) => row.studentId === studentId)
              .sort((left, right) => left.studentId.localeCompare(right.studentId)),
        }),
      }),
    }),
  }) as unknown as Database;

const createCredentialListDb = (rows: CourseCredential[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'published')
              .sort((left, right) => left.title.localeCompare(right.title)),
        }),
      }),
    }),
  }) as unknown as Database;

const createCredentialAwardListDb = (rows: CredentialAward[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.credentialId === credentialId)
              .filter((row) => row.studentId === studentId)
              .sort((left, right) => left.studentId.localeCompare(right.studentId)),
        }),
      }),
    }),
  }) as unknown as Database;

const createConversationThreadListDb = (rows: ConversationThread[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'open')
              .filter((row) => row.participantIds.includes(studentId))
              .sort((left, right) => right.lastMessageAt.getTime() - left.lastMessageAt.getTime()),
        }),
      }),
    }),
  }) as unknown as Database;

const createConversationMessageListDb = (rows: ConversationMessage[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.threadId === conversationThreadId)
              .sort((left, right) => left.sentAt.getTime() - right.sentAt.getTime()),
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseGroupSetListDb = (rows: CourseGroupSet[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'active')
              .sort(
                (left, right) =>
                  left.position - right.position || left.name.localeCompare(right.name),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseGroupListDb = (rows: CourseGroup[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.id === courseGroupId),
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.courseId === courseId)
              .filter((row) => row.status === 'active')
              .sort(
                (left, right) =>
                  left.position - right.position || left.name.localeCompare(right.name),
              ),
        }),
      }),
    }),
  }) as unknown as Database;

const createCourseGroupMemberListDb = (rows: CourseGroupMember[]): Database =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () =>
            rows
              .filter((row) => row.tenantId === tenantId)
              .filter((row) => row.groupId === courseGroupId)
              .sort((left, right) => left.userId.localeCompare(right.userId)),
        }),
      }),
    }),
  }) as unknown as Database;

const createWhereCaptureDb = (capture: { condition: unknown }): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          capture.condition = condition;
          return {
            limit: async () => [],
          };
        },
      }),
    }),
  }) as unknown as Database;

const createWhereOrderCaptureDb = (capture: { condition: unknown }): Database =>
  ({
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          capture.condition = condition;
          return {
            orderBy: async () => [],
          };
        },
      }),
    }),
  }) as unknown as Database;

const getObjectProperty = (value: unknown, propertyName: string): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return (value as Record<PropertyKey, unknown>)[propertyName];
};

const extractDrizzleStringValues = (value: unknown, seen = new Set<object>()): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractDrizzleStringValues(item, seen));
  }

  return Object.values(value as Record<string, unknown>).flatMap((item) =>
    extractDrizzleStringValues(item, seen),
  );
};

const collectSqlChunkColumnNames = (value: unknown, seen = new WeakSet<object>()): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSqlChunkColumnNames(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkColumnNames(chunk, seen));
  }

  const ownName = getObjectProperty(value, 'name');
  return typeof ownName === 'string' ? [ownName] : [];
};

const collectSqlChunkParamValues = (value: unknown, seen = new WeakSet<object>()): unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSqlChunkParamValues(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const queryChunks = getObjectProperty(value, 'queryChunks');
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((chunk) => collectSqlChunkParamValues(chunk, seen));
  }

  if (!Object.prototype.hasOwnProperty.call(value, 'value')) {
    return [];
  }

  const ownValue = getObjectProperty(value, 'value');
  return Array.isArray(ownValue) ? ownValue : [ownValue];
};

const expectTenantScopedCondition = (condition: unknown): void => {
  const names = collectSqlChunkColumnNames(condition);

  expect(names).toContain('tenant_id');
};

describe('traditional LMS domain repositories', () => {
  it('stores and reads a course in the tenant boundary', async () => {
    const rows: Course[] = [];

    await expect(saveCourse(createInsertOnlyDb(rows), course)).resolves.toEqual(course);
    await expect(getCourseById(createSelectOnlyDb([course]), tenantId, course.id)).resolves.toEqual(
      course,
    );
    await expect(
      getCourseById(createSelectOnlyDb([course]), '01J9QW7B6N5W2YH3D3A1V0KE31', course.id),
    ).resolves.toBeNull();
  });

  it('creates blueprint courses when requested', async () => {
    const rows: unknown[] = [];

    const created = await createCourse(createInsertOnlyDb(rows), {
      tenantId,
      code: 'BP-101',
      title: 'Blueprint Writing',
      status: 'draft',
      startsAt: null,
      endsAt: null,
      isBlueprint: true,
    });

    expect(created.isBlueprint).toBe(true);
    expect(rows).toHaveLength(1);
  });

  it('reads course enrollment gating settings', async () => {
    await expect(
      getCourseEnrollmentInfo(
        createSelectOnlyDb([{ ...course, enrollmentCode: 'JOIN-WRIT-101' }]),
        tenantId,
        courseId,
      ),
    ).resolves.toEqual({
      status: 'active',
      enrollmentCode: 'JOIN-WRIT-101',
      maxEnrollments: null,
      waitlistEnabled: false,
      enrollmentApprovalRequired: false,
      startsAt: now,
      endsAt: null,
    });
  });

  it('lists course sections in course order', async () => {
    const laterSection = CourseSection.parse({
      ...courseSection,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3F',
      name: 'Section B',
      position: 1,
    });
    const otherCourseSection = CourseSection.parse({
      ...courseSection,
      id: '01J9QW7B6N5W2YH3D3A1V0KE40',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE41',
    });
    const archivedSection = CourseSection.parse({
      ...courseSection,
      id: '01J9QW7B6N5W2YH3D3A1V0KE42',
      name: 'Archived section',
      status: 'archived',
      position: 2,
    });

    await expect(
      listCourseSectionsForCourse(
        createCourseSectionListDb([
          laterSection,
          otherCourseSection,
          archivedSection,
          courseSection,
        ]),
        {
          tenantId,
          courseId,
          statuses: ['active'],
        },
      ),
    ).resolves.toEqual([courseSection, laterSection]);
  });

  it('lists published course announcements with pinned items first', async () => {
    const laterAnnouncement = CourseAnnouncement.parse({
      ...courseAnnouncement,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5K',
      title: 'Draft workshop room change',
      pinned: false,
      postedAt: new Date('2026-05-11T00:00:00.000Z'),
    });
    const draftAnnouncement = CourseAnnouncement.parse({
      ...courseAnnouncement,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5M',
      status: 'draft',
    });

    await expect(
      listCourseAnnouncementsForCourse(
        createCourseAnnouncementListDb([laterAnnouncement, draftAnnouncement, courseAnnouncement]),
        {
          tenantId,
          courseId,
          statuses: ['published'],
        },
      ),
    ).resolves.toEqual([courseAnnouncement, laterAnnouncement]);
  });

  it('creates course sections with generated identity and timestamps', async () => {
    const rows: CourseSection[] = [];

    await expect(
      createCourseSection(
        createInsertOnlyDb(rows),
        {
          tenantId,
          courseId,
          name: 'Section B',
          status: 'active',
          position: 1,
          meetingDays: ['monday', 'wednesday'],
          meetingStartTime: '09:30',
          meetingEndTime: '10:45',
          location: 'Room 204',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
      meetingDays: ['monday', 'wednesday'],
      meetingStartTime: '09:30',
      meetingEndTime: '10:45',
      location: 'Room 204',
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      courseId,
      name: 'Section B',
      status: 'active',
      position: 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('creates course pages with generated identity and initial version', async () => {
    const rows: CoursePage[] = [];

    await expect(
      createCoursePage(
        createInsertOnlyDb(rows),
        {
          tenantId,
          courseId,
          title: 'Evidence page',
          body: 'Evidence needs reasoning that connects it to a claim.',
          visibility: 'published',
          learningObjectiveIds: [learningObjectiveId],
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      courseId,
      title: 'Evidence page',
      body: 'Evidence needs reasoning that connects it to a claim.',
      visibility: 'published',
      version: 1,
      learningObjectiveIds: [learningObjectiveId],
      createdAt: now,
      updatedAt: now,
    });
  });

  it('creates course announcements with generated identity and publish metadata', async () => {
    const rows: CourseAnnouncement[] = [];

    await expect(
      createCourseAnnouncement(
        createInsertOnlyDb(rows),
        {
          tenantId,
          courseId,
          authorId: studentId,
          title: 'Essay workshop reminder',
          body: 'Bring one paragraph and one question for peer review.',
          status: 'published',
          pinned: true,
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      authorId: studentId,
      title: 'Essay workshop reminder',
      body: 'Bring one paragraph and one question for peer review.',
      status: 'published',
      pinned: true,
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      courseId,
      authorId: studentId,
      title: 'Essay workshop reminder',
      body: 'Bring one paragraph and one question for peer review.',
      status: 'published',
      pinned: true,
      postedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('lists course quizzes by open date and title', async () => {
    const laterQuiz = Quiz.parse({
      ...quiz,
      id: '01J9QW7B6N5W2YH3D3A1V0KE45',
      title: 'Later quiz',
      opensAt: new Date('2026-05-11T00:00:00.000Z'),
    });
    const otherCourseQuiz = Quiz.parse({
      ...quiz,
      id: '01J9QW7B6N5W2YH3D3A1V0KE46',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE47',
    });
    const archivedQuiz = Quiz.parse({
      ...quiz,
      id: '01J9QW7B6N5W2YH3D3A1V0KE48',
      status: 'archived',
    });

    await expect(
      listQuizzesForCourse(createQuizListDb([laterQuiz, otherCourseQuiz, archivedQuiz, quiz]), {
        tenantId,
        courseId,
        statuses: ['published'],
      }),
    ).resolves.toEqual([quiz, laterQuiz]);
  });

  it('creates quizzes with hidden access controls', async () => {
    const rows: Array<Quiz & { accessPasswordHash: string | null; allowedIpRanges: string[] }> = [];

    const created = await createQuiz(
      createInsertOnlyDb(rows),
      {
        tenantId,
        courseId,
        moduleId: null,
        unitId: null,
        position: null,
        title: 'Access-controlled quiz',
        description: null,
        status: 'published',
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: null,
        shuffleQuestions: false,
        maxAttempts: 1,
        accessPasswordHash: 'scrypt:v1:hash',
        allowedIpRanges: ['203.0.113.0/24'],
      },
      now,
    );

    expect(rows[0]).toMatchObject({
      accessPasswordHash: 'scrypt:v1:hash',
      allowedIpRanges: ['203.0.113.0/24'],
    });
    expect(created).toMatchObject({
      accessPasswordRequired: true,
      allowedIpRanges: ['203.0.113.0/24'],
    });
    expect(created).not.toHaveProperty('accessPasswordHash');
  });

  it('reads quiz access controls without returning quiz content', async () => {
    const row = {
      ...quiz,
      accessPasswordHash: 'scrypt:v1:hash',
      allowedIpRanges: ['203.0.113.0/24'],
    };

    await expect(
      getQuizAccessControlsForCourse(createQuizAccessControlsDb([row]), tenantId, courseId, quizId),
    ).resolves.toEqual({
      accessPasswordHash: 'scrypt:v1:hash',
      allowedIpRanges: ['203.0.113.0/24'],
    });
  });

  it('lists module quizzes in author-defined position order', async () => {
    const laterQuiz = Quiz.parse({
      ...quiz,
      id: '01J9QW7B6N5W2YH3D3A1V0KE49',
      moduleId,
      unitId,
      position: 2,
      title: 'A title after placement',
      opensAt: null,
    });
    const earlierQuiz = Quiz.parse({
      ...quiz,
      id: '01J9QW7B6N5W2YH3D3A1V0KE50',
      moduleId,
      unitId,
      position: 1,
      title: 'Z title before placement',
      opensAt: null,
    });
    const otherModuleQuiz = Quiz.parse({
      ...quiz,
      id: '01J9QW7B6N5W2YH3D3A1V0KE51',
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      unitId: null,
      position: 0,
      title: 'Other module check',
      opensAt: null,
    });

    await expect(
      listQuizzesForCourse(createQuizListDb([laterQuiz, earlierQuiz, otherModuleQuiz]), {
        tenantId,
        courseId,
        statuses: ['published'],
        moduleId,
        unitId,
      }),
    ).resolves.toEqual([earlierQuiz, laterQuiz]);
  });

  it('lists quiz questions in quiz order without answer keys', async () => {
    const laterQuestion = QuizQuestion.parse({
      ...quizQuestion,
      id: '01J9QW7B6N5W2YH3D3A1V0KE49',
      position: 1,
      questionType: 'essay',
      prompt: 'Explain why the evidence supports the claim.',
      choices: [],
    });
    const otherQuizQuestion = QuizQuestion.parse({
      ...quizQuestion,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4A',
      quizId: '01J9QW7B6N5W2YH3D3A1V0KE4B',
    });

    const questions = await listQuizQuestionsForQuiz(
      createQuizQuestionListDb([laterQuestion, otherQuizQuestion, quizQuestion]),
      { tenantId, quizId },
    );

    expect(questions).toEqual([quizQuestion, laterQuestion]);
    expect(JSON.stringify(questions)).not.toContain('correct');
    expect(JSON.stringify(questions)).not.toContain('answer');
  });

  it('lists quiz attempts for the requested student by attempt number', async () => {
    const secondAttempt = QuizAttempt.parse({
      ...quizAttempt,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5F',
      attemptNumber: 2,
      status: 'in_progress',
      submittedAt: null,
      score: null,
    });
    const otherStudentAttempt = QuizAttempt.parse({
      ...quizAttempt,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5G',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE5H',
    });

    await expect(
      listQuizAttemptsForQuiz(
        createQuizAttemptListDb([secondAttempt, otherStudentAttempt, quizAttempt]),
        {
          tenantId,
          quizId,
          studentId,
        },
      ),
    ).resolves.toEqual([quizAttempt, secondAttempt]);
  });

  it('saves quiz attempts for learner quiz starts', async () => {
    const rows: QuizAttempt[] = [];
    const startedAttempt = QuizAttempt.parse({
      ...quizAttempt,
      status: 'in_progress',
      submittedAt: null,
      score: null,
    });

    await expect(saveQuizAttempt(createInsertOnlyDb(rows), startedAttempt)).resolves.toEqual(
      startedAttempt,
    );
    expect(rows).toEqual([startedAttempt]);
  });

  it('records quiz attempts with generated identity and attempt number', async () => {
    const rows: QuizAttempt[] = [];

    const attempt = await recordQuizAttempt(
      createInsertOnlyDb(rows),
      {
        tenantId,
        quizId,
        studentId,
        attemptNumber: 2,
      },
      now,
    );

    expect(attempt).toMatchObject({
      tenantId,
      quizId,
      studentId,
      attemptNumber: 2,
      status: 'in_progress',
      startedAt: now,
      submittedAt: null,
      score: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(attempt.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(rows).toEqual([attempt]);
  });

  it('submits in-progress quiz attempts with a submitted timestamp', async () => {
    const inProgressAttempt = QuizAttempt.parse({
      ...quizAttempt,
      status: 'in_progress',
      submittedAt: null,
      score: null,
    });

    await expect(
      submitQuizAttempt(createQuizAttemptSubmitDb(inProgressAttempt), {
        tenantId,
        attemptId: quizAttemptId,
        submittedAt: now,
      }),
    ).resolves.toEqual({
      ...inProgressAttempt,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
    });
  });

  it('saves quiz attempt responses for attempt answers', async () => {
    const rows: QuizAttemptResponse[] = [];

    await expect(
      saveQuizAttemptResponse(createInsertOnlyDb(rows), quizAttemptResponse),
    ).resolves.toEqual(quizAttemptResponse);
    expect(rows).toEqual([quizAttemptResponse]);
  });

  it('lists quiz attempt responses in quiz question position and response id order', async () => {
    const laterQuestion = QuizQuestion.parse({
      ...quizQuestion,
      id: '01J9QW7B6N5W2YH3D3A1V0KE49',
      position: 0,
      questionType: 'essay',
      prompt: 'Explain why the evidence supports the claim.',
      choices: [],
    });
    const laterResponse = QuizAttemptResponse.parse({
      ...quizAttemptResponse,
      id: '01J9QW7B6N5W2YH3D3A1V0KE60',
      questionId: laterQuestion.id,
      answer: {
        kind: 'text',
        text: 'The evidence explains the claim directly.',
      },
    });

    await expect(
      listQuizAttemptResponsesForAttempt(
        createQuizAttemptResponseListDb(
          [laterResponse, quizAttemptResponse],
          [laterQuestion, quizQuestion],
        ),
        {
          tenantId,
          attemptId: quizAttemptId,
        },
      ),
    ).resolves.toEqual([quizAttemptResponse, laterResponse]);
  });

  it('upserts quiz attempt responses through the attempt-question identity', async () => {
    const capture = { options: null as unknown };

    await saveQuizAttemptResponse(
      createQuizAttemptResponseConflictCaptureDb(capture),
      quizAttemptResponse,
    );

    const target = getObjectProperty(capture.options, 'target');
    expect(Array.isArray(target)).toBe(true);
    expect((target as { name?: string }[]).map((column) => column.name)).toEqual([
      'tenant_id',
      'attempt_id',
      'question_id',
    ]);
  });

  it('records quiz attempt responses with generated identity and timestamps', async () => {
    const rows: QuizAttemptResponse[] = [];

    const response = await recordQuizAttemptResponse(
      createInsertOnlyDb(rows),
      {
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        questionId: quizQuestionId,
        answer: {
          kind: 'text',
          text: 'The explanation connects the quote to the claim.',
        },
      },
      now,
    );

    expect(response).toMatchObject({
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      questionId: quizQuestionId,
      answer: {
        kind: 'text',
        text: 'The explanation connects the quote to the claim.',
      },
      createdAt: now,
      updatedAt: now,
    });
    expect(response.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(rows).toEqual([response]);
  });

  it('saves generated quiz attempt probes separately from stored quiz questions', async () => {
    const rows: QuizAttemptProbe[] = [];

    await expect(saveQuizAttemptProbe(createInsertOnlyDb(rows), quizAttemptProbe)).resolves.toEqual(
      quizAttemptProbe,
    );
    await expect(
      listQuizAttemptProbesForAttempt(createQuizAttemptProbeListDb([quizAttemptProbe]), {
        tenantId,
        attemptId: quizAttemptId,
      }),
    ).resolves.toEqual([quizAttemptProbe]);
    expect(rows[0]).not.toHaveProperty('questionType');
  });

  it('records generated quiz attempt probe responses through probe identity', async () => {
    const probes: QuizAttemptProbe[] = [];
    const responses: QuizAttemptProbeResponse[] = [];

    const probe = await recordQuizAttemptProbe(
      createInsertOnlyDb(probes),
      {
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        learningObjectiveId,
        sourceQuestionBankQuestionId: null,
        position: 1,
        difficultyTarget: 0.75,
        prompt: 'Create a claim supported by evidence.',
        renderModel: { format: 'free_response' },
        points: 4,
        answerKey: null,
        aiGenerationLogId: null,
      },
      now,
    );
    const response = await recordQuizAttemptProbeResponse(
      createInsertOnlyDb(responses),
      {
        tenantId,
        quizId,
        attemptId: quizAttemptId,
        probeId: probe.id,
        answer: quizAttemptProbeResponse.answer,
      },
      now,
    );

    expect(probe.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(response).toMatchObject({
      tenantId,
      quizId,
      attemptId: quizAttemptId,
      probeId: probe.id,
      answer: quizAttemptProbeResponse.answer,
    });
  });

  it('saves generated quiz attempt probe responses for retryable answer writes', async () => {
    const rows: QuizAttemptProbeResponse[] = [];

    await expect(
      saveQuizAttemptProbeResponse(createInsertOnlyDb(rows), quizAttemptProbeResponse),
    ).resolves.toEqual(quizAttemptProbeResponse);
  });

  it('lists requested question banks in title order', async () => {
    const laterBank = QuestionBank.parse({
      ...questionBank,
      id: '01J9QW7B6N5W2YH3D3A1V0KE79',
      title: 'Z revision bank',
    });
    const archivedBank = QuestionBank.parse({
      ...questionBank,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7A',
      title: 'Archived item bank',
      status: 'archived',
    });
    const otherCourseBank = QuestionBank.parse({
      ...questionBank,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7B',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE7C',
    });

    await expect(
      listQuestionBanksForCourse(
        createQuestionBankListDb([laterBank, archivedBank, otherCourseBank, questionBank]),
        { tenantId, courseId, statuses: ['active', 'archived'] },
      ),
    ).resolves.toEqual([archivedBank, questionBank, laterBank]);
  });

  it('lists question bank questions in bank order without answer keys', async () => {
    const laterQuestion = QuestionBankQuestion.parse({
      ...questionBankQuestion,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7D',
      position: 1,
      questionType: 'essay',
      prompt: 'Explain why the evidence supports the claim.',
      choices: [],
    });
    const otherBankQuestion = QuestionBankQuestion.parse({
      ...questionBankQuestion,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7E',
      questionBankId: '01J9QW7B6N5W2YH3D3A1V0KE7F',
    });

    const questions = await listQuestionBankQuestionsForBank(
      createQuestionBankQuestionListDb([laterQuestion, otherBankQuestion, questionBankQuestion]),
      { tenantId, questionBankId },
    );

    expect(questions).toEqual([questionBankQuestion, laterQuestion]);
    expect(JSON.stringify(questions)).not.toContain('correct');
    expect(JSON.stringify(questions)).not.toContain('answer');
  });

  it('lists course attendance sessions by start time and title', async () => {
    const laterSession = AttendanceSession.parse({
      ...attendanceSession,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4E',
      title: 'Week 2 seminar',
      startsAt: new Date('2026-05-11T00:00:00.000Z'),
      endsAt: new Date('2026-05-11T01:00:00.000Z'),
    });
    const cancelledSession = AttendanceSession.parse({
      ...attendanceSession,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4F',
      status: 'cancelled',
    });

    await expect(
      listAttendanceSessionsForCourse(
        createAttendanceSessionListDb([laterSession, cancelledSession, attendanceSession]),
        {
          tenantId,
          courseId,
          statuses: ['scheduled'],
        },
      ),
    ).resolves.toEqual([attendanceSession, laterSession]);
  });

  it('creates attendance sessions with generated identity and timestamps', async () => {
    const rows: AttendanceSession[] = [];

    await expect(
      createAttendanceSession(
        createInsertOnlyDb(rows),
        {
          tenantId,
          courseId,
          title: 'Week 2 seminar',
          startsAt: new Date('2026-05-11T00:00:00.000Z'),
          endsAt: new Date('2026-05-11T01:00:00.000Z'),
          status: 'scheduled',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      title: 'Week 2 seminar',
      startsAt: new Date('2026-05-11T00:00:00.000Z'),
      endsAt: new Date('2026-05-11T01:00:00.000Z'),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      courseId,
      title: 'Week 2 seminar',
      startsAt: new Date('2026-05-11T00:00:00.000Z'),
      endsAt: new Date('2026-05-11T01:00:00.000Z'),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('lists attendance records for the requested student only', async () => {
    const otherStudentRecord = AttendanceRecord.parse({
      ...attendanceRecord,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4G',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE4H',
    });

    await expect(
      listAttendanceRecordsForSession(
        createAttendanceRecordListDb([otherStudentRecord, attendanceRecord]),
        {
          tenantId,
          sessionId: attendanceSessionId,
          studentId,
        },
      ),
    ).resolves.toEqual([attendanceRecord]);
  });

  it('records attendance through the session-student identity', async () => {
    const rows: AttendanceRecord[] = [];
    const capture = { executionSql: [] as string[], options: null as unknown };

    await expect(
      recordAttendanceRecord(
        createAttendanceRecordUpsertDb(rows, capture),
        {
          tenantId,
          courseId,
          sessionId: attendanceSessionId,
          studentId,
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      sessionId: attendanceSessionId,
      studentId,
      status: 'late',
      note: 'Arrived after the opening activity.',
      recordedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(capture.executionSql).toHaveLength(2);
    expect(capture.executionSql.every((query) => query.includes('FOR UPDATE'))).toBe(true);
    const target = getObjectProperty(capture.options, 'target');
    expect(Array.isArray(target)).toBe(true);
    expect((target as { name?: string }[]).map((column) => column.name)).toEqual([
      'tenant_id',
      'session_id',
      'student_id',
    ]);
  });

  it('updates existing attendance records on conflict', async () => {
    const existingRecord = AttendanceRecord.parse({
      ...attendanceRecord,
      status: 'absent',
      note: null,
      recordedAt: new Date('2026-05-09T00:00:00.000Z'),
      updatedAt: new Date('2026-05-09T00:00:00.000Z'),
    });
    const rows = [existingRecord];
    const capture = { executionSql: [] as string[], options: null as unknown };

    await expect(
      recordAttendanceRecord(
        createAttendanceRecordUpsertDb(rows, capture),
        {
          tenantId,
          courseId,
          sessionId: attendanceSessionId,
          studentId,
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
        now,
      ),
    ).resolves.toMatchObject({
      id: existingRecord.id,
      status: 'late',
      note: 'Arrived after the opening activity.',
      recordedAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: existingRecord.id,
      status: 'late',
      note: 'Arrived after the opening activity.',
      recordedAt: now,
      updatedAt: now,
    });
  });

  it('rejects attendance records when the session is unavailable or student is not enrolled', async () => {
    await expect(
      recordAttendanceRecord(
        createAttendanceRecordUpsertDb(
          [],
          { executionSql: [], options: null },
          {
            sessionStatus: null,
          },
        ),
        {
          tenantId,
          courseId,
          sessionId: attendanceSessionId,
          studentId,
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
        now,
      ),
    ).rejects.toBeInstanceOf(AttendanceSessionUnavailableError);

    await expect(
      recordAttendanceRecord(
        createAttendanceRecordUpsertDb(
          [],
          { executionSql: [], options: null },
          {
            hasStudent: false,
          },
        ),
        {
          tenantId,
          courseId,
          sessionId: attendanceSessionId,
          studentId,
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
        now,
      ),
    ).rejects.toBeInstanceOf(AttendanceStudentUnavailableError);
  });

  it('lists course completion requirements by position and title', async () => {
    const laterRequirement = CompletionRequirement.parse({
      ...completionRequirement,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4M',
      moduleId,
      title: 'Pass the evidence quiz',
      requirementType: 'pass_quiz',
      targetType: 'quiz',
      targetId: quizId,
      minScorePercent: 70,
      position: 1,
    });
    const otherModuleRequirement = CompletionRequirement.parse({
      ...laterRequirement,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4P',
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE32',
    });
    const archivedRequirement = CompletionRequirement.parse({
      ...completionRequirement,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4N',
      status: 'archived',
    });

    await expect(
      listCompletionRequirementsForCourse(
        createCompletionRequirementListDb([
          laterRequirement,
          otherModuleRequirement,
          archivedRequirement,
          completionRequirement,
        ]),
        {
          tenantId,
          courseId,
          moduleId,
          statuses: ['active'],
        },
      ),
    ).resolves.toEqual([completionRequirement, laterRequirement]);
  });

  it('lists completion progress for the requested student only', async () => {
    const otherStudentProgress = CompletionProgress.parse({
      ...completionProgress,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4P',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE4Q',
    });

    await expect(
      listCompletionProgressForRequirement(
        createCompletionProgressListDb([otherStudentProgress, completionProgress]),
        {
          tenantId,
          requirementId: completionRequirementId,
          studentId,
        },
      ),
    ).resolves.toEqual([completionProgress]);
  });

  it('lists published course credentials by title', async () => {
    const badge = CourseCredential.parse({
      ...courseCredential,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4T',
      credentialType: 'badge',
      title: 'Argument badge',
    });
    const draftCredential = CourseCredential.parse({
      ...courseCredential,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4V',
      status: 'draft',
    });

    await expect(
      listCredentialsForCourse(createCredentialListDb([courseCredential, draftCredential, badge]), {
        tenantId,
        courseId,
        statuses: ['published'],
      }),
    ).resolves.toEqual([badge, courseCredential]);
  });

  it('lists credential awards for the requested student only', async () => {
    const otherStudentAward = CredentialAward.parse({
      ...credentialAward,
      id: '01J9QW7B6N5W2YH3D3A1V0KE4W',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE4X',
    });

    await expect(
      listCredentialAwardsForCredential(
        createCredentialAwardListDb([otherStudentAward, credentialAward]),
        {
          tenantId,
          credentialId,
          studentId,
        },
      ),
    ).resolves.toEqual([credentialAward]);
  });

  it('lists conversation threads for a course participant', async () => {
    const laterThread = ConversationThread.parse({
      ...conversationThread,
      id: '01J9QW7B6N5W2YH3D3A1V0KE51',
      subject: 'Second question',
      lastMessageAt: new Date('2026-05-10T02:00:00.000Z'),
    });
    const archivedThread = ConversationThread.parse({
      ...conversationThread,
      id: '01J9QW7B6N5W2YH3D3A1V0KE52',
      status: 'archived',
    });

    await expect(
      listConversationThreadsForCourse(
        createConversationThreadListDb([conversationThread, archivedThread, laterThread]),
        {
          tenantId,
          courseId,
          statuses: ['open'],
          participantId: studentId,
        },
      ),
    ).resolves.toEqual([laterThread, conversationThread]);
  });

  it('lists conversation messages in sent order', async () => {
    const laterMessage = ConversationMessage.parse({
      ...conversationMessage,
      id: '01J9QW7B6N5W2YH3D3A1V0KE53',
      senderId: '01J9QW7B6N5W2YH3D3A1V0KE4Z',
      body: 'Yes, I mean the second paragraph.',
      sentAt: new Date('2026-05-10T01:00:00.000Z'),
    });

    await expect(
      listConversationMessagesForThread(
        createConversationMessageListDb([laterMessage, conversationMessage]),
        {
          tenantId,
          threadId: conversationThreadId,
        },
      ),
    ).resolves.toEqual([conversationMessage, laterMessage]);
  });

  it('lists active course group sets by position and name', async () => {
    const laterGroupSet = CourseGroupSet.parse({
      ...courseGroupSet,
      id: '01J9QW7B6N5W2YH3D3A1V0KE58',
      name: 'Lab teams',
      position: 1,
    });
    const archivedGroupSet = CourseGroupSet.parse({
      ...courseGroupSet,
      id: '01J9QW7B6N5W2YH3D3A1V0KE59',
      status: 'archived',
    });

    await expect(
      listCourseGroupSetsForCourse(
        createCourseGroupSetListDb([laterGroupSet, archivedGroupSet, courseGroupSet]),
        {
          tenantId,
          courseId,
          statuses: ['active'],
        },
      ),
    ).resolves.toEqual([courseGroupSet, laterGroupSet]);
  });

  it('lists active course groups by position and name', async () => {
    const laterGroup = CourseGroup.parse({
      ...courseGroup,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5A',
      name: 'Team Beta',
      position: 1,
    });
    const archivedGroup = CourseGroup.parse({
      ...courseGroup,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5B',
      status: 'archived',
    });

    await expect(
      listCourseGroupsForCourse(createCourseGroupListDb([laterGroup, archivedGroup, courseGroup]), {
        tenantId,
        courseId,
        statuses: ['active'],
      }),
    ).resolves.toEqual([courseGroup, laterGroup]);
  });

  it('looks up a course group inside a tenant course', async () => {
    await expect(
      getCourseGroupForCourse(
        createCourseGroupListDb([courseGroup]),
        tenantId,
        courseId,
        courseGroupId,
      ),
    ).resolves.toEqual(courseGroup);
  });

  it('lists course group members by user', async () => {
    const leader = CourseGroupMember.parse({
      ...courseGroupMember,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5C',
      userId: '01J9QW7B6N5W2YH3D3A1V0KE5D',
      role: 'leader',
    });

    await expect(
      listCourseGroupMembers(createCourseGroupMemberListDb([leader, courseGroupMember]), {
        tenantId,
        groupId: courseGroupId,
      }),
    ).resolves.toEqual([courseGroupMember, leader]);
  });

  it('stores an assignment with an active rubric reference', async () => {
    const rubrics: Rubric[] = [];
    const assignments: Assignment[] = [];

    await expect(saveRubric(createInsertOnlyDb(rubrics), rubric)).resolves.toEqual(rubric);
    await expect(saveAssignment(createInsertOnlyDb(assignments), assignment)).resolves.toEqual(
      assignment,
    );
    expect(assignments[0]?.activeRubricId).toBe(rubric.id);
  });

  it('lists course assignments in due-date order with optional status filtering', async () => {
    const laterAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      title: 'Later essay',
      dueAt: new Date('2026-05-15T00:00:00.000Z'),
    });
    const earlierAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      title: 'Earlier essay',
      dueAt: new Date('2026-05-12T00:00:00.000Z'),
    });
    const draftAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      title: 'Draft essay',
      status: 'draft',
      dueAt: new Date('2026-05-11T00:00:00.000Z'),
    });
    const otherCourseAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE35',
      title: 'Other course essay',
      dueAt: new Date('2026-05-10T00:00:00.000Z'),
    });

    await expect(
      listAssignmentsForCourse(
        createAssignmentListDb([
          laterAssignment,
          draftAssignment,
          otherCourseAssignment,
          earlierAssignment,
        ]),
        {
          tenantId,
          courseId,
          statuses: ['published'],
        },
      ),
    ).resolves.toEqual([earlierAssignment, laterAssignment]);
  });

  it('lists module assignments in author-defined position order', async () => {
    const laterAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE31',
      moduleId,
      unitId,
      position: 2,
      title: 'A title after placement',
      dueAt: null,
    });
    const earlierAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE32',
      moduleId,
      unitId,
      position: 1,
      title: 'Z title before placement',
      dueAt: null,
    });
    const otherModuleAssignment = Assignment.parse({
      ...assignment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      unitId: null,
      position: 0,
      title: 'Other module essay',
      dueAt: null,
    });

    await expect(
      listAssignmentsForCourse(
        createAssignmentListDb([laterAssignment, earlierAssignment, otherModuleAssignment]),
        {
          tenantId,
          courseId,
          statuses: ['published'],
          moduleId,
          unitId,
        },
      ),
    ).resolves.toEqual([earlierAssignment, laterAssignment]);
  });

  it('lists active assignment overrides by target', async () => {
    const groupOverride = AssignmentOverride.parse({
      ...assignmentOverride,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7H',
      targetType: 'group',
      targetId: courseGroupId,
      dueAt: new Date('2026-05-13T00:00:00.000Z'),
    });
    const archivedOverride = AssignmentOverride.parse({
      ...assignmentOverride,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7J',
      status: 'archived',
    });
    const otherAssignmentOverride = AssignmentOverride.parse({
      ...assignmentOverride,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7K',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE7M',
    });

    await expect(
      listAssignmentOverridesForAssignment(
        createAssignmentOverrideListDb([
          assignmentOverride,
          groupOverride,
          archivedOverride,
          otherAssignmentOverride,
        ]),
        { tenantId, assignmentId, statuses: ['active'] },
      ),
    ).resolves.toEqual([groupOverride, assignmentOverride]);
  });

  it('can list active and archived assignment overrides for staff views', async () => {
    const archivedOverride = AssignmentOverride.parse({
      ...assignmentOverride,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7J',
      status: 'archived',
      targetId: '01J9QW7B6N5W2YH3D3A1V0KE7Q',
    });

    await expect(
      listAssignmentOverridesForAssignment(
        createAssignmentOverrideListDb(
          [assignmentOverride, archivedOverride],
          ['active', 'archived'],
        ),
        { tenantId, assignmentId, statuses: ['active', 'archived'] },
      ),
    ).resolves.toEqual([assignmentOverride, archivedOverride]);
  });

  it('builds tenant, assignment, and status scoped override list queries from input', async () => {
    const overrideCapture = { condition: null as unknown };

    await listAssignmentOverridesForAssignment(createWhereOrderCaptureDb(overrideCapture), {
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE7N',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE7P',
      statuses: ['active', 'archived'],
    });

    const names = collectSqlChunkColumnNames(overrideCapture.condition);
    const values = collectSqlChunkParamValues(overrideCapture.condition);
    expect(names).toContain('tenant_id');
    expect(names).toContain('assignment_id');
    expect(names).toContain('status');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE7N');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE7P');
    expect(values).toContain('active');
    expect(values).toContain('archived');
  });

  it('stores student drafts and final submissions without requiring AI', async () => {
    const drafts: Draft[] = [];
    const submissions: Submission[] = [];

    await expect(saveDraft(createInsertOnlyDb(drafts), draft)).resolves.toEqual(draft);
    await expect(saveSubmission(createInsertOnlyDb(submissions), submission)).resolves.toEqual(
      submission,
    );
    expect(submissions[0]?.contentSnapshot).toEqual(draft.blocks);
  });

  it('lists assignment submissions in submitted-at order', async () => {
    const laterSubmission = Submission.parse({
      ...submission,
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      submittedAt: new Date('2026-05-10T01:00:00.000Z'),
      createdAt: new Date('2026-05-10T01:00:00.000Z'),
    });
    const otherAssignmentSubmission = Submission.parse({
      ...submission,
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
    });

    await expect(
      listSubmissionsForAssignment(
        createSubmissionListDb([laterSubmission, otherAssignmentSubmission, submission]),
        tenantId,
        assignmentId,
      ),
    ).resolves.toEqual([submission, laterSubmission]);
  });

  it('lists student assignment submissions in submitted-at order', async () => {
    const laterSubmission = Submission.parse({
      ...submission,
      id: '01J9QW7B6N5W2YH3D3A1V0KE33',
      version: 2,
      submittedAt: new Date('2026-05-10T01:00:00.000Z'),
      createdAt: new Date('2026-05-10T01:00:00.000Z'),
    });
    const otherStudentSubmission = Submission.parse({
      ...submission,
      id: '01J9QW7B6N5W2YH3D3A1V0KE34',
      studentId: '01J9QW7B6N5W2YH3D3A1V0KE35',
    });

    await expect(
      listSubmissionsForStudentAssignment(
        createStudentSubmissionListDb([laterSubmission, otherStudentSubmission, submission]),
        tenantId,
        assignmentId,
        studentId,
      ),
    ).resolves.toEqual([submission, laterSubmission]);
  });

  it('lists assignment peer reviews by due date for staff', async () => {
    const laterPeerReview = AssignmentPeerReview.parse({
      ...assignmentPeerReview,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7S',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE7T',
      dueAt: new Date('2026-05-13T00:00:00.000Z'),
    });
    const unscheduledPeerReview = AssignmentPeerReview.parse({
      ...assignmentPeerReview,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7V',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE7Z',
      dueAt: null,
    });
    const otherAssignmentPeerReview = AssignmentPeerReview.parse({
      ...assignmentPeerReview,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7W',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE7X',
    });

    await expect(
      listAssignmentPeerReviewsForAssignment(
        createAssignmentPeerReviewListDb([
          laterPeerReview,
          otherAssignmentPeerReview,
          unscheduledPeerReview,
          assignmentPeerReview,
        ]),
        { tenantId, assignmentId },
      ),
    ).resolves.toEqual([assignmentPeerReview, laterPeerReview, unscheduledPeerReview]);
  });

  it('lists only assigned peer reviews for a student reviewer', async () => {
    const otherReviewerPeerReview = AssignmentPeerReview.parse({
      ...assignmentPeerReview,
      id: '01J9QW7B6N5W2YH3D3A1V0KE7S',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE7T',
    });

    await expect(
      listAssignmentPeerReviewsForAssignment(
        createAssignmentPeerReviewListDb([otherReviewerPeerReview, assignmentPeerReview]),
        { tenantId, assignmentId, reviewerId: peerReviewerId },
      ),
    ).resolves.toEqual([assignmentPeerReview]);
  });

  it('lists only assigned peer reviews for a reviewer and submission', async () => {
    const otherSubmissionPeerReview = AssignmentPeerReview.parse({
      ...assignmentPeerReview,
      id: '01J9QW7B6N5W2YH3D3A1V0KE84',
      submissionId: otherSubmissionId,
    });

    await expect(
      listAssignmentPeerReviewsForAssignment(
        createAssignmentPeerReviewListDb([otherSubmissionPeerReview, assignmentPeerReview]),
        { tenantId, assignmentId, reviewerId: peerReviewerId, submissionId: submission.id },
      ),
    ).resolves.toEqual([assignmentPeerReview]);
  });

  it('lists submission attachments by position and display name', async () => {
    const laterAttachment = SubmissionAttachment.parse({
      ...submissionAttachment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5R',
      fileResourceId: '01J9QW7B6N5W2YH3D3A1V0KE5S',
      displayName: 'source-notes.pdf',
      position: 1,
    });
    const otherSubmissionAttachment = SubmissionAttachment.parse({
      ...submissionAttachment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5T',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE5V',
    });

    await expect(
      listSubmissionAttachmentsForSubmission(
        createSubmissionAttachmentListDb([
          laterAttachment,
          otherSubmissionAttachment,
          submissionAttachment,
        ]),
        { tenantId, submissionId: submission.id },
      ),
    ).resolves.toEqual([submissionAttachment, laterAttachment]);
  });

  it('creates submission attachments with an explicit position', async () => {
    const rows: SubmissionAttachment[] = [];

    const created = await createSubmissionAttachment(
      createInsertOnlyDb(rows),
      {
        tenantId,
        submissionId: submission.id,
        fileResourceId: submissionAttachmentFileId,
        displayName: 'evidence-appendix.pdf',
        position: 2,
      },
      now,
    );

    expect(created).toMatchObject({
      tenantId,
      submissionId: submission.id,
      fileResourceId: submissionAttachmentFileId,
      displayName: 'evidence-appendix.pdf',
      position: 2,
      createdAt: now,
    });
    expect(rows).toEqual([created]);
  });

  it('lists submission comments in created order with optional visibility filtering', async () => {
    const laterComment = SubmissionComment.parse({
      ...submissionComment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE5Z',
      body: 'Here is the expanded explanation.',
      createdAt: new Date('2026-05-10T01:00:00.000Z'),
      updatedAt: new Date('2026-05-10T01:00:00.000Z'),
    });
    const staffOnlyComment = SubmissionComment.parse({
      ...submissionComment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE60',
      body: 'Check for possible late penalty.',
      visibility: 'staff_only',
    });
    const otherSubmissionComment = SubmissionComment.parse({
      ...submissionComment,
      id: '01J9QW7B6N5W2YH3D3A1V0KE61',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE62',
    });

    await expect(
      listSubmissionCommentsForSubmission(
        createSubmissionCommentListDb([
          laterComment,
          staffOnlyComment,
          otherSubmissionComment,
          submissionComment,
        ]),
        { tenantId, submissionId: submission.id, visibilities: ['student_visible'] },
      ),
    ).resolves.toEqual([submissionComment, laterComment]);
  });

  it('creates submission comments with generated identity and timestamps', async () => {
    const rows: SubmissionComment[] = [];

    await expect(
      createSubmissionComment(
        createInsertOnlyDb(rows),
        {
          tenantId,
          submissionId: submission.id,
          authorId: studentId,
          body: 'Please expand the evidence explanation.',
          visibility: 'student_visible',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      submissionId: submission.id,
      authorId: studentId,
      body: 'Please expand the evidence explanation.',
      visibility: 'student_visible',
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      submissionId: submission.id,
      authorId: studentId,
      body: 'Please expand the evidence explanation.',
      visibility: 'student_visible',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('builds tenant and submission scoped attachment list queries from input', async () => {
    const attachmentCapture = { condition: null as unknown };

    await listSubmissionAttachmentsForSubmission(createWhereOrderCaptureDb(attachmentCapture), {
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE5W',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE5X',
    });

    const names = collectSqlChunkColumnNames(attachmentCapture.condition);
    const values = collectSqlChunkParamValues(attachmentCapture.condition);
    expect(names).toContain('tenant_id');
    expect(names).toContain('submission_id');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE5W');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE5X');
  });

  it('builds tenant, submission, and visibility scoped comment list queries from input', async () => {
    const commentCapture = { condition: null as unknown };

    await listSubmissionCommentsForSubmission(createWhereOrderCaptureDb(commentCapture), {
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE63',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE64',
      visibilities: ['staff_only'],
    });

    const names = collectSqlChunkColumnNames(commentCapture.condition);
    const values = collectSqlChunkParamValues(commentCapture.condition);
    expect(names).toContain('tenant_id');
    expect(names).toContain('submission_id');
    expect(names).toContain('visibility');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE63');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE64');
    expect(values).toContain('staff_only');
  });

  it('builds tenant, assignment, reviewer, and submission scoped peer review list queries from input', async () => {
    const peerReviewCapture = { condition: null as unknown };

    await listAssignmentPeerReviewsForAssignment(createWhereOrderCaptureDb(peerReviewCapture), {
      tenantId: '01J9QW7B6N5W2YH3D3A1V0KE7W',
      assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE7X',
      reviewerId: '01J9QW7B6N5W2YH3D3A1V0KE7Y',
      submissionId: '01J9QW7B6N5W2YH3D3A1V0KE7Z',
    });

    const names = collectSqlChunkColumnNames(peerReviewCapture.condition);
    const values = collectSqlChunkParamValues(peerReviewCapture.condition);
    expect(names).toContain('tenant_id');
    expect(names).toContain('assignment_id');
    expect(names).toContain('reviewer_id');
    expect(names).toContain('submission_id');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE7W');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE7X');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE7Y');
    expect(values).toContain('01J9QW7B6N5W2YH3D3A1V0KE7Z');
  });

  it('lists course discussion topics in course order', async () => {
    const laterTopic = DiscussionTopic.parse({
      ...discussionTopic,
      id: '01J9QW7B6N5W2YH3D3A1V0KE38',
      title: 'Later workshop',
      position: 1,
    });
    const otherCourseTopic = DiscussionTopic.parse({
      ...discussionTopic,
      id: '01J9QW7B6N5W2YH3D3A1V0KE39',
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE3A',
    });

    await expect(
      listDiscussionTopicsForCourse(
        createDiscussionTopicListDb([laterTopic, otherCourseTopic, discussionTopic]),
        { tenantId, courseId },
      ),
    ).resolves.toEqual([discussionTopic, laterTopic]);
  });

  it('lists module discussion topics in author-defined position order', async () => {
    const laterTopic = DiscussionTopic.parse({
      ...discussionTopic,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3E',
      moduleId,
      unitId,
      position: 2,
      title: 'A title after placement',
    });
    const earlierTopic = DiscussionTopic.parse({
      ...discussionTopic,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3F',
      moduleId,
      unitId,
      position: 1,
      title: 'Z title before placement',
    });
    const otherModuleTopic = DiscussionTopic.parse({
      ...discussionTopic,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3G',
      moduleId: '01J9QW7B6N5W2YH3D3A1V0KE34',
      unitId: null,
      position: 0,
      title: 'Other module workshop',
    });

    await expect(
      listDiscussionTopicsForCourse(
        createDiscussionTopicListDb([laterTopic, earlierTopic, otherModuleTopic]),
        {
          tenantId,
          courseId,
          visibilities: ['published'],
          moduleId,
          unitId,
        },
      ),
    ).resolves.toEqual([earlierTopic, laterTopic]);
  });

  it('creates discussion topics with generated identity and timestamps', async () => {
    const rows: DiscussionTopic[] = [];

    await expect(
      createDiscussionTopic(
        createInsertOnlyDb(rows),
        {
          tenantId,
          courseId,
          moduleId,
          unitId,
          title: 'Week 2 evidence workshop',
          prompt: 'Share the sentence where your evidence needs the most help.',
          visibility: 'draft',
          position: 2,
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      courseId,
      moduleId,
      unitId,
      title: 'Week 2 evidence workshop',
      prompt: 'Share the sentence where your evidence needs the most help.',
      visibility: 'draft',
      position: 2,
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      courseId,
      moduleId,
      unitId,
      title: 'Week 2 evidence workshop',
      prompt: 'Share the sentence where your evidence needs the most help.',
      visibility: 'draft',
      position: 2,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('lists discussion posts for a topic in created order', async () => {
    const laterPost = DiscussionPost.parse({
      ...discussionPost,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3B',
      parentPostId: discussionPost.id,
      createdAt: new Date('2026-05-10T01:00:00.000Z'),
      updatedAt: new Date('2026-05-10T01:00:00.000Z'),
    });
    const otherTopicPost = DiscussionPost.parse({
      ...discussionPost,
      id: '01J9QW7B6N5W2YH3D3A1V0KE3C',
      topicId: '01J9QW7B6N5W2YH3D3A1V0KE3D',
    });

    await expect(
      listDiscussionPostsForTopic(
        createDiscussionPostListDb([laterPost, otherTopicPost, discussionPost]),
        { tenantId, topicId: discussionTopicId },
      ),
    ).resolves.toEqual([discussionPost, laterPost]);
  });

  it('creates published discussion posts with generated identity and timestamps', async () => {
    const rows: DiscussionPost[] = [];

    await expect(
      createDiscussionPost(
        createInsertOnlyDb(rows),
        {
          tenantId,
          topicId: discussionTopicId,
          authorId: studentId,
          parentPostId: discussionPostId,
          body: 'I can make the evidence connection clearer in the second sentence.',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      topicId: discussionTopicId,
      authorId: studentId,
      parentPostId: discussionPostId,
      body: 'I can make the evidence connection clearer in the second sentence.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tenantId,
      topicId: discussionTopicId,
      authorId: studentId,
      parentPostId: discussionPostId,
      body: 'I can make the evidence connection clearer in the second sentence.',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('creates draft discussion posts', async () => {
    const rows: DiscussionPost[] = [];

    await expect(
      createDiscussionPost(
        createInsertOnlyDb(rows),
        {
          tenantId,
          topicId: discussionTopicId,
          authorId: studentId,
          parentPostId: null,
          body: 'I need to finish this reply later.',
          status: 'draft',
        },
        now,
      ),
    ).resolves.toMatchObject({
      tenantId,
      topicId: discussionTopicId,
      authorId: studentId,
      parentPostId: null,
      body: 'I need to finish this reply later.',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('updates discussion post body and draft status', async () => {
    const rows = [
      DiscussionPost.parse({
        ...discussionPost,
        status: 'draft',
      }),
    ];

    await expect(
      updateDiscussionPost(
        createDiscussionPostUpdateDb(rows),
        {
          tenantId,
          topicId: discussionTopicId,
          postId: discussionPostId,
          body: 'Ready to publish.',
          status: 'published',
        },
        now,
      ),
    ).resolves.toMatchObject({
      body: 'Ready to publish.',
      status: 'published',
      updatedAt: now,
    });
  });

  it('upserts drafts through the tenant-scoped draft identity', async () => {
    const capture = { options: null as unknown };

    await saveDraft(createDraftConflictCaptureDb(capture), draft);

    const target = getObjectProperty(capture.options, 'target');
    expect(Array.isArray(target)).toBe(true);
    expect((target as { name?: string }[]).map((column) => column.name)).toEqual([
      'tenant_id',
      'id',
    ]);
  });

  it('upserts student drafts only for the owning assignment and student', async () => {
    const capture = { options: null as unknown };

    await saveStudentDraft(createDraftConflictCaptureDb(capture), draft);

    const target = getObjectProperty(capture.options, 'target');
    const setWhere = getObjectProperty(capture.options, 'setWhere');
    expect(Array.isArray(target)).toBe(true);
    expect((target as { name?: string }[]).map((column) => column.name)).toEqual([
      'tenant_id',
      'id',
    ]);
    expect(collectSqlChunkColumnNames(setWhere)).toEqual(
      expect.arrayContaining(['assignment_id', 'student_id']),
    );
  });

  it('builds tenant-scoped read queries for tenant-owned records', async () => {
    const courseCapture = { condition: null as unknown };
    const assignmentCapture = { condition: null as unknown };
    const rubricCapture = { condition: null as unknown };
    const submissionCapture = { condition: null as unknown };

    await getCourseById(createWhereCaptureDb(courseCapture), tenantId, courseId);
    await getAssignmentById(createWhereCaptureDb(assignmentCapture), tenantId, assignmentId);
    await getRubricById(createWhereCaptureDb(rubricCapture), tenantId, rubricId);
    await getSubmissionById(createWhereCaptureDb(submissionCapture), tenantId, submission.id);

    expectTenantScopedCondition(courseCapture.condition);
    expectTenantScopedCondition(assignmentCapture.condition);
    expectTenantScopedCondition(rubricCapture.condition);
    expectTenantScopedCondition(submissionCapture.condition);
  });

  it('builds status-filtered course section list queries', async () => {
    const sectionCapture = { condition: null as unknown };

    await listCourseSectionsForCourse(createWhereOrderCaptureDb(sectionCapture), {
      tenantId,
      courseId,
      statuses: ['active'],
    });

    const names = collectSqlChunkColumnNames(sectionCapture.condition);
    expect(names).toContain('tenant_id');
    expect(names).toContain('course_id');
    expect(names).toContain('status');
  });
});
